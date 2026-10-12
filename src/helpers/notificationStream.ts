import { Response } from "express";

let clients: Response[] = [];

export const notificationHandler = (req: any, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
};

export const pushNotification = (data: any) => {
  clients.forEach((res) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};
