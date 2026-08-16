import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin SDK with Service Account
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
      databaseURL: firebaseConfig.databaseURL
    });
    console.log("Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT env var.");
  } else if (fs.existsSync(path.join(process.cwd(), "service-account.json"))) {
    const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), "service-account.json"), "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: firebaseConfig.databaseURL
    });
    console.log("Firebase Admin initialized with service-account.json file.");
  } else {
    // Use project ID from config
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
      databaseURL: firebaseConfig.databaseURL
    });
    console.log("Firebase Admin initialized with projectId default credentials.");
  }
} catch (e) {
  console.log("Firebase Admin initialization error: ", e);
}

// Automatically provision or update Admin user credentials
async function ensureAdminUser() {
  const adminEmail = "arepallyjashwanth08@gmail.com";
  const adminPassword = "464612";
  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(adminEmail);
      await admin.auth().updateUser(userRecord.uid, {
        password: adminPassword,
        emailVerified: true,
        displayName: "Admin"
      });
      console.log(`✅ Admin user ${adminEmail} updated successfully (UID: ${userRecord.uid})`);
    } catch (notFound) {
      userRecord = await admin.auth().createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: "Admin",
        emailVerified: true
      });
      console.log(`✅ Admin user ${adminEmail} created successfully (UID: ${userRecord.uid})`);
    }

    const db = admin.firestore();
    // Update users doc
    await db.collection("users").doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: adminEmail,
      displayName: "Admin",
      username: "admin",
      role: "admin",
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Update admins doc
    await db.collection("admins").doc(userRecord.uid).set({
      email: adminEmail,
      role: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection("admins").doc(adminEmail).set({
      uid: userRecord.uid,
      email: adminEmail,
      role: "admin"
    }, { merge: true });

    console.log(`✅ Admin roles & permissions granted in Firestore for ${adminEmail}`);
  } catch (err) {
    console.error("Error provisioning admin user:", err);
  }
}

// Call admin provisioning on launch
ensureAdminUser();

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const zapUrl = "https://pay.zapupi.com/api";

  // Endpoint to create an order
  app.post("/api/create-order", async (req, res) => {
    try {
      const { order_id, amount, customer_mobile, remark, success_url, failed_url } = req.body;
      const zapKey = process.env.ZAP_UPI_KEY;
      if (!zapKey) return res.status(500).json({ status: "error", message: "ZAP_UPI_KEY environment variable not configured" });

      const response = await fetch(`${zapUrl}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zap_key: zapKey,
          order_id: String(order_id),
          amount: String(amount),
          customer_mobile: String(customer_mobile || "0000000000"),
          remark: String(remark || "Add Coins"),
          success_url,
          failed_url
        })
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Endpoint to handle the webhook from ZapUPI
  app.post("/webhook/zapupi", async (req, res) => {
    try {
      const { order_id, status, txn_id, amount, pay_amount, customer_mobile } = req.body;
      
      console.log(`Webhook received for order ${order_id} with status ${status}`);
      
      if (status === "Success" || status === "Success") {
        // Find the deposit request in Firestore
        const db = admin.firestore();
        const depositQuery = await db.collection("deposit_requests").where("order_id", "==", order_id).limit(1).get();
        
        if (!depositQuery.empty) {
          const doc = depositQuery.docs[0];
          const data = doc.data();
          
          if (data.status !== "completed") {
            // Update transaction status
            await doc.ref.update({
              status: "completed",
              txn_id: txn_id || null,
              pay_amount: parseFloat(pay_amount) || parseFloat(amount)
            });
            
            // Add coins to the user
            const userId = data.userId;
            const amountNum = parseFloat(amount);
            const userRef = db.collection("users").doc(userId);
            
            await db.runTransaction(async (t) => {
              const userDoc = await t.get(userRef);
              if (userDoc.exists) {
                const userData = userDoc.data();
                const totalBalance = (userData?.totalBalance || 0) + amountNum;
                const depositBalance = (userData?.depositBalance || 0) + amountNum;
                const walletBalance = (userData?.walletBalance || 0) + amountNum;
                
                t.update(userRef, { totalBalance, depositBalance, walletBalance });
              }
            });
            
            console.log(`Payment confirmed and credited to user ${userId} for order ${order_id}`);
          }
        } else {
          console.log(`Order ${order_id} not found in deposit_requests.`);
        }
      }
      
      // Always respond with 200 OK so ZapUPI knows it was received
      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(200).json({ status: "ok" }); // Return 200 to prevent retries of bad data
    }
  });

  // Endpoint for frontend to check the order status manually
  app.post("/api/verify-order", async (req, res) => {
    try {
      const { order_id } = req.body;
      const zapKey = process.env.ZAP_UPI_KEY;
      if (!zapKey) return res.status(500).json({ status: "error", message: "ZAP_UPI_KEY environment variable not configured" });

      const response = await fetch(`${zapUrl}/order-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           zap_key: zapKey,
           order_id: String(order_id)
        })
      });
      
      const data = await response.json();
      
      // If we find it successful, let's also trigger the update logic here
      // in case the webhook was missed or delayed.
      if (data.status === "success" && data.data && data.data.status === "Success") {
        const orderData = data.data;
        const db = admin.firestore();
        const depositQuery = await db.collection("deposit_requests").where("order_id", "==", String(order_id)).limit(1).get();
        if (!depositQuery.empty) {
           // update code omitted for brevity as it's same as above
           // keeping it short here but leaving it functionally identical since we are just appending new endpoints
           const doc = depositQuery.docs[0];
           const reqData = doc.data();
           if (reqData.status !== "completed") {
             const amt = parseFloat(String(orderData.amount));
             await doc.ref.update({ status: "completed", txn_id: orderData.txn_id || null });
             const userRef = db.collection("users").doc(reqData.userId);
             await db.runTransaction(async (t) => {
               const userDoc = await t.get(userRef);
               if (userDoc.exists) {
                 const userData = userDoc.data();
                 const totalBalance = (userData?.totalBalance || 0) + amt;
                 const depositBalance = (userData?.depositBalance || 0) + amt;
                 const walletBalance = (userData?.walletBalance || 0) + amt;
                 t.update(userRef, { totalBalance, depositBalance, walletBalance });
               }
             });
           }
        }
      }
      
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // ========== ADMIN FIRESTORE BYPASS ENDPOINTS ==========
  const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      // Allow super admin emails or users in admins collection
      if (decoded.email === 'arepallyjashwanth08@gmail.com' || decoded.email === 'malleshr20944@gmail.com') {
        next();
      } else {
        const adminDoc = await admin.firestore().collection('admins').doc(decoded.uid).get();
        if (adminDoc.exists) next();
        else res.status(403).json({ error: 'Forbidden' });
      }
    } catch (e: any) {
       res.status(401).json({ error: 'Invalid Token' });
    }
  };

  app.post("/api/admin/tournaments", verifyAdmin, async (req, res) => {
    try {
      const docRef = await admin.firestore().collection('tournaments').add({
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: docRef.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/admin/tournaments/:id", verifyAdmin, async (req, res) => {
    try {
      await admin.firestore().collection('tournaments').doc(req.params.id).update({
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin/tournaments/:id", verifyAdmin, async (req, res) => {
    try {
      await admin.firestore().collection('tournaments').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Admin Games Endpoints
  app.post("/api/admin/games", verifyAdmin, async (req, res) => {
    try {
      const docRef = await admin.firestore().collection('games').add({
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: docRef.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/admin/games/:id", verifyAdmin, async (req, res) => {
    try {
      await admin.firestore().collection('games').doc(req.params.id).update({
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin/games/:id", verifyAdmin, async (req, res) => {
    try {
      await admin.firestore().collection('games').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Admin Broadcast Web Push FCM Notification to all subscribed devices
  app.post("/api/admin/send-push", verifyAdmin, async (req, res) => {
    try {
      const { title, body, icon } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
      }

      // 1. Store notification in Firestore collection
      const notifRef = await admin.firestore().collection('notifications').add({
        title,
        body,
        readBy: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Fetch all stored FCM tokens across users
      const usersSnap = await admin.firestore().collection('users').get();
      const tokens: string[] = [];
      usersSnap.forEach((doc) => {
        const u = doc.data();
        if (Array.isArray(u.fcmTokens)) {
          tokens.push(...u.fcmTokens);
        } else if (u.fcmToken && typeof u.fcmToken === 'string') {
          tokens.push(u.fcmToken);
        }
      });

      const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));

      let sentCount = 0;
      if (uniqueTokens.length > 0) {
        try {
          const message = {
            notification: {
              title,
              body,
            },
            webpush: {
              notification: {
                title,
                body,
                icon: icon || '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
              },
              fcmOptions: {
                link: '/'
              }
            },
            tokens: uniqueTokens
          };

          const response = await admin.messaging().sendEachForMulticast(message);
          sentCount = response.successCount;
        } catch (fcmErr) {
          console.error("FCM Multicast error:", fcmErr);
        }
      }

      res.json({
        success: true,
        id: notifRef.id,
        tokensTargeted: uniqueTokens.length,
        delivered: sentCount
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Targeted Tournament Update & Match Reminder Push Notification API
  app.post("/api/tournaments/:id/send-push", verifyAdmin, async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const { title, body, type, roomId, roomPassword, matchTime, target } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
      }

      // Fetch tournament doc to get title and participants
      const tDoc = await admin.firestore().collection('tournaments').doc(tournamentId).get();
      const tData = tDoc.exists ? tDoc.data() : null;
      const tournamentTitle = tData?.title || title;

      // Determine recipient tokens
      let tokens: string[] = [];
      const participants = Array.isArray(tData?.participants) ? tData.participants : [];

      if (target === 'participants' && participants.length > 0) {
        // Fetch tokens only for participants
        for (const uid of participants) {
          const uDoc = await admin.firestore().collection('users').doc(uid).get();
          if (uDoc.exists) {
            const u = uDoc.data();
            if (Array.isArray(u?.fcmTokens)) tokens.push(...u.fcmTokens);
            else if (u?.fcmToken) tokens.push(u.fcmToken);
          }
        }
      } else {
        // Fetch tokens for all users
        const usersSnap = await admin.firestore().collection('users').get();
        usersSnap.forEach((doc) => {
          const u = doc.data();
          if (Array.isArray(u.fcmTokens)) tokens.push(...u.fcmTokens);
          else if (u.fcmToken) tokens.push(u.fcmToken);
        });
      }

      const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));

      // Save notification log
      await admin.firestore().collection('notifications').add({
        title,
        body,
        tournamentId,
        type: type || 'TOURNAMENT_UPDATE',
        roomId: roomId || null,
        roomPassword: roomPassword || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      let sentCount = 0;
      if (uniqueTokens.length > 0) {
        try {
          const message = {
            notification: {
              title: type === 'MATCH_REMINDER' 
                ? `⏰ Match Reminder: ${title}` 
                : type === 'ROOM_CREDENTIALS' 
                ? `🔑 Room ID Ready: ${title}`
                : `🏆 Tournament Update: ${title}`,
              body,
            },
            data: {
              type: String(type || 'TOURNAMENT_UPDATE'),
              tournamentId: String(tournamentId),
              tournamentTitle: String(tournamentTitle),
              roomId: String(roomId || ''),
              roomPassword: String(roomPassword || ''),
              matchTime: String(matchTime || ''),
              url: `/tournaments/${tournamentId}`
            },
            webpush: {
              notification: {
                title: type === 'MATCH_REMINDER' 
                  ? `⏰ Match Reminder: ${title}` 
                  : `🏆 Tournament: ${title}`,
                body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: `tournament-${tournamentId}`,
              },
              fcmOptions: {
                link: `/tournaments/${tournamentId}`
              }
            },
            tokens: uniqueTokens
          };

          const response = await admin.messaging().sendEachForMulticast(message);
          sentCount = response.successCount;
        } catch (fcmErr) {
          console.error("Tournament FCM error:", fcmErr);
        }
      }

      res.json({
        success: true,
        type: type || 'TOURNAMENT_UPDATE',
        tokensTargeted: uniqueTokens.length,
        delivered: sentCount
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
