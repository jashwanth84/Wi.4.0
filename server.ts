import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin SDK
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } else {
    // Use project ID from config
    admin.initializeApp({ projectId: firebaseConfig.projectId });
  }
} catch (e) {
  console.log("Firebase Admin not configured: ", e);
}

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
      // Let's assume if they have a valid token they are authorized for the bypass (since UI enforces it).
      // Or require their email to be malleshr20944@gmail.com
      if (decoded.email === 'malleshr20944@gmail.com') {
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
