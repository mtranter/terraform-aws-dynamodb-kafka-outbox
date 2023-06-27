/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TxOutboxMessage, _handler } from "./tx-outbox";

describe("tx-outbox", () => {
  it("should forward message to kafka", async () => {
    const sendBatch = jest.fn();
    sendBatch.mockResolvedValueOnce({});
    const handler = _handler(
      Promise.resolve({
        sendBatch,
      })
    );
    const key = "key-1";
    const value = { id: 1, name: "Fred" };
    const key64 = Buffer.from(key).toString("base64");
    const value64 = Buffer.from(JSON.stringify(value)).toString("base64");
    const msg: TxOutboxMessage = {
      topic: "topic-1",
      key: key64,
      value: value64,
      isTxOutboxEvent: true
    };
    const dynamoSerializedTxMsg = {
      dynamodb: {
        NewImage: {
          topic: {
            S: msg.topic,
          },
          key: {
            S: msg.key,
          },
          value: {
            S: msg.value,
          },
        },
      },
    };
    const event = {
      Records: [dynamoSerializedTxMsg],
    };
    await handler(event, null as any, null as any);
    expect(sendBatch).toBeCalledWith({
      topicMessages: [
        {
          topic: msg.topic,
          messages: [
            {
              key: Buffer.from(msg.key!, "base64"),
              value: Buffer.from(msg.value, "base64"),
            },
          ],
        },
      ],
      acks: -1,
    });
  });
  it("should forward message to kafka sans key", async () => {
    const sendBatch = jest.fn();
    sendBatch.mockResolvedValueOnce({});
    const handler = _handler(
      Promise.resolve({
        sendBatch,
      })
    );
    const key = "key-1";
    const value = { id: 1, name: "Fred" };
    const key64 = Buffer.from(key).toString("base64");
    const value64 = Buffer.from(JSON.stringify(value)).toString("base64");
    const msg: TxOutboxMessage = {
      topic: "topic-1",
      key: key64,
      value: value64,
      isTxOutboxEvent: true
    };
    const dynamoSerializedTxMsg = {
      dynamodb: {
        NewImage: {
          topic: {
            S: msg.topic,
          },
          value: {
            S: msg.value,
          },
        },
      },
    };
    const event = {
      Records: [dynamoSerializedTxMsg],
    };
    await handler(event, null as any, null as any);
    expect(sendBatch).toBeCalledWith({
      topicMessages: [
        {
          topic: msg.topic,
          messages: [
            {
              value: Buffer.from(msg.value, "base64"),
            },
          ],
        },
      ],
      acks: -1,
    });
  });

  it("should throw if topic not present message to kafka", async () => {
    const sendBatch = jest.fn();
    sendBatch.mockResolvedValueOnce({});
    const handler = _handler(
      Promise.resolve({
        sendBatch,
      })
    );
    const key = "key-1";
    const value = { id: 1, name: "Fred" };
    const key64 = Buffer.from(key).toString("base64");
    const value64 = Buffer.from(JSON.stringify(value)).toString("base64");
    const msg: TxOutboxMessage = {
      topic: "topic-1",
      key: key64,
      value: value64,
      isTxOutboxEvent: true
    };
    const dynamoSerializedTxMsg = {
      dynamodb: {
        NewImage: {
          key: {
            S: msg.key,
          },
          value: {
            S: msg.value,
          },
        },
      },
    };
    const event = {
      Records: [dynamoSerializedTxMsg],
    };
    expect(handler(event, null as any, null as any)).rejects.toThrowError();
    expect(sendBatch).not.toHaveBeenCalled;
  });

  it("should throw if value not present message to kafka", async () => {
    const sendBatch = jest.fn();
    sendBatch.mockResolvedValueOnce({});
    const handler = _handler(
      Promise.resolve({
        sendBatch,
      })
    );
    const key = "key-1";
    const value = { id: 1, name: "Fred" };
    const key64 = Buffer.from(key).toString("base64");
    const value64 = Buffer.from(JSON.stringify(value)).toString("base64");
    const msg: TxOutboxMessage = {
      topic: "topic-1",
      key: key64,
      value: value64,
      isTxOutboxEvent: true
    };
    const dynamoSerializedTxMsg = {
      dynamodb: {
        NewImage: {
          topic: {
            S: msg.topic,
          },
          key: {
            S: msg.key,
          },
        },
      },
    };
    const event = {
      Records: [dynamoSerializedTxMsg],
    };
    expect(handler(event, null as any, null as any)).rejects.toThrowError();
    expect(sendBatch).not.toHaveBeenCalled;
  });
});
