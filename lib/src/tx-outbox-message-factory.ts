import { SchemaRegistry } from "@kafkajs/confluent-schema-registry";
import { TxOutboxMessage } from "./tx-outbox";

export type TxOutboxMessageFactory = ReturnType<typeof TxOutboxMessageFactory>;

export const TxOutboxMessageFactory = ({
  registry,
}: {
  registry: Pick<SchemaRegistry, "encode">;
}) => ({
  createOutboxMessage: async <K, V>({
    key,
    value,
    headers,
    partition,
    timestamp,
    topic,
    keySchemaId,
    valueSchemaId,
  }: {
    key?: K;
    value: V;
    headers?: Record<string, string>;
    partition?: number;
    timestamp?: string;
    topic: string;
    keySchemaId: number;
    valueSchemaId: number;
  }): Promise<TxOutboxMessage> => {
    const keyP = key ? registry.encode(keySchemaId, key) : undefined;
    const valueP = registry.encode(valueSchemaId, value);
    const keyBinary = keyP ? await keyP : undefined;
    const valueBinary = await valueP;
    return {
      topic,
      key: keyBinary?.toString("base64"),
      value: valueBinary.toString("base64"),
      headers,
      partition,
      timestamp,
      isTxOutboxEvent: true
    };
  },
});