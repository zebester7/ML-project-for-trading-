import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import WebSocket from "ws";
import * as ss from "simple-statistics";

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // --- Market State ---
  let currentPrice = 65000;
  let priceHistory: { time: number; price: number; prediction: number }[] = [];
  const MAX_HISTORY = 100;

  // --- Binance WebSocket Connection ---
  function connectBinance() {
    const binanceWs = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");

    binanceWs.on("message", (data) => {
      const trade = JSON.parse(data.toString());
      const price = parseFloat(trade.p);
      const time = trade.T;

      currentPrice = price;

      // ML Model: Linear Regression on last 20 points
      let prediction = price;
      if (priceHistory.length >= 20) {
        const dataPoints = priceHistory.slice(-20).map((h, i) => [i, h.price]);
        const regression = ss.linearRegression(dataPoints);
        const nextIndex = dataPoints.length;
        prediction = ss.linearRegressionLine(regression)(nextIndex);
      }

      const update = { time, price, prediction };
      priceHistory.push(update);
      if (priceHistory.length > MAX_HISTORY) priceHistory.shift();

      // Broadcast to everyone
      io.emit("market_update", update);
    });

    binanceWs.on("error", (err) => {
      console.error("Binance WebSocket error:", err);
    });

    binanceWs.on("close", () => {
      console.log("Binance WebSocket closed. Reconnecting in 5s...");
      setTimeout(connectBinance, 5000);
    });
  }

  connectBinance();

  // Relay updates to clients
  io.on("connection", (socket) => {
    // Send current state to new client
    socket.emit("init_state", { currentPrice, priceHistory });
  });

  // --- Vite Middleware ---
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
