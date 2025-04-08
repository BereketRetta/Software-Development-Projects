// src/models/operation.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IOperation extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'insert' | 'delete';
  position: number;
  text?: string;
  length?: number;
  timestamp: Date;
  version: number;
}

const OperationSchema: Schema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['insert', 'delete'], required: true },
  position: { type: Number, required: true },
  text: { type: String },
  length: { type: Number },
  timestamp: { type: Date, default: Date.now },
  version: { type: Number, required: true }
});

export default mongoose.model<IOperation>('Operation', OperationSchema);