var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_firebase_admin = __toESM(require("firebase-admin"), 1);

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "fireclash-pro-67d8b",
  appId: "1:701577504795:web:2155a8d84f756b710230be",
  apiKey: "AIzaSyBMHz-XIqjoOQsts0gomaQX0eYfzPnqRoI",
  authDomain: "fireclash-pro-67d8b.firebaseapp.com",
  databaseURL: "https://fireclash-pro-67d8b-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "fireclash-pro-67d8b.firebasestorage.app",
  messagingSenderId: "701577504795",
  measurementId: ""
};

// server.ts
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    import_firebase_admin.default.initializeApp({
      credential: import_firebase_admin.default.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } else {
    import_firebase_admin.default.initializeApp({ projectId: firebase_applet_config_default.projectId });
  }
} catch (e) {
  console.log("Firebase Admin not configured: ", e);
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use((0, import_cors.default)());
  app.use(import_express.default.json());
  const zapUrl = "https://pay.zapupi.com/api";
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
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });
  app.post("/webhook/zapupi", async (req, res) => {
    try {
      const { order_id, status, txn_id, amount, pay_amount, customer_mobile } = req.body;
      console.log(`Webhook received for order ${order_id} with status ${status}`);
      if (status === "Success" || status === "Success") {
        const db = import_firebase_admin.default.firestore();
        const depositQuery = await db.collection("deposit_requests").where("order_id", "==", order_id).limit(1).get();
        if (!depositQuery.empty) {
          const doc = depositQuery.docs[0];
          const data = doc.data();
          if (data.status !== "completed") {
            await doc.ref.update({
              status: "completed",
              txn_id: txn_id || null,
              pay_amount: parseFloat(pay_amount) || parseFloat(amount)
            });
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
      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(200).json({ status: "ok" });
    }
  });
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
      if (data.status === "success" && data.data && data.data.status === "Success") {
        const orderData = data.data;
        const db = import_firebase_admin.default.firestore();
        const depositQuery = await db.collection("deposit_requests").where("order_id", "==", String(order_id)).limit(1).get();
        if (!depositQuery.empty) {
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
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });
  const verifyAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = await import_firebase_admin.default.auth().verifyIdToken(token);
      if (decoded.email === "malleshr20944@gmail.com") {
        next();
      } else {
        const adminDoc = await import_firebase_admin.default.firestore().collection("admins").doc(decoded.uid).get();
        if (adminDoc.exists) next();
        else res.status(403).json({ error: "Forbidden" });
      }
    } catch (e) {
      res.status(401).json({ error: "Invalid Token" });
    }
  };
  app.post("/api/admin/tournaments", verifyAdmin, async (req, res) => {
    try {
      const docRef = await import_firebase_admin.default.firestore().collection("tournaments").add({
        ...req.body,
        createdAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: docRef.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.put("/api/admin/tournaments/:id", verifyAdmin, async (req, res) => {
    try {
      await import_firebase_admin.default.firestore().collection("tournaments").doc(req.params.id).update({
        ...req.body,
        updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/admin/tournaments/:id", verifyAdmin, async (req, res) => {
    try {
      await import_firebase_admin.default.firestore().collection("tournaments").doc(req.params.id).delete();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/admin/games", verifyAdmin, async (req, res) => {
    try {
      const docRef = await import_firebase_admin.default.firestore().collection("games").add({
        ...req.body,
        createdAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: docRef.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.put("/api/admin/games/:id", verifyAdmin, async (req, res) => {
    try {
      await import_firebase_admin.default.firestore().collection("games").doc(req.params.id).update({
        ...req.body,
        updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/admin/games/:id", verifyAdmin, async (req, res) => {
    try {
      await import_firebase_admin.default.firestore().collection("games").doc(req.params.id).delete();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const PORT = 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
