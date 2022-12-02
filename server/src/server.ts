import express, { Request, Response, Application } from "express";

import { Streamer } from "hive-stream";

const ss = new Streamer();

ss.onCustomJson((op, { sender, isSignedWithActiveKey }, blockNumber, blockId, prevBlockId, trxId, blockTime) => {
    console.log(op);
});

ss.onPost((op, blockNumber, blockId, prevBlockId, trxId, blockTime) => {
    console.log(op);
});

const app: Application = express();

const PORT = process.env.PORT || 8000;

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello Typescript with Node.js!");
});

app.listen(PORT, (): void => {
  console.log(`Server Running here 👉 https://localhost:${PORT}`);
});
