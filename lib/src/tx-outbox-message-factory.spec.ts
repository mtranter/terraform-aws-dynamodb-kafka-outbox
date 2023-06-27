import { TxOutboxMessageFactory } from "./tx-outbox-message-factory";

describe("tx-outbox-message-factory", () => {
  const encode = jest.fn();
  const mockRegistry = {
    encode,
  };
  const sut = TxOutboxMessageFactory({
    registry: mockRegistry,
  });
  describe("createOutboxMessage", () => {
    it("should create a message with a key", async () => {
      const key = "key-1";
      const value = { id: 1, name: "Fred" };
      const topic = "topic-1";
      const valueString = JSON.stringify(value);
      const encodedKey = Buffer.from(key).toString("base64");
      const encodedValue = Buffer.from(valueString).toString("base64");

      encode.mockResolvedValueOnce(encodedKey);
      encode.mockResolvedValueOnce(encodedValue);

      const msg = await sut.createOutboxMessage({
        key,
        value: encodedValue,
        topic,
        keySchemaId: 1,
        valueSchemaId: 2,
      });
      expect(msg).toEqual({
        headers: undefined,
        topic: "topic-1",
        key: encodedKey,
        value: encodedValue,
        isTxOutboxEvent: true,
      });
    });
    it("should create a message sans key", async () => {
      const value = { id: 1, name: "Fred" };
      const topic = "topic-1";
      const valueString = JSON.stringify(value);
      const encodedValue = Buffer.from(valueString).toString("base64");

      encode.mockResolvedValueOnce(encodedValue);

      const msg = await sut.createOutboxMessage({
        value: encodedValue,
        topic,
        keySchemaId: 1,
        valueSchemaId: 2,
      });
      expect(msg).toEqual({
        headers: undefined,
        topic: "topic-1",
        value: encodedValue,
        isTxOutboxEvent: true,
      });
    });
  });
});
