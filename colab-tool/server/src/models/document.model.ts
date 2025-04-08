// src/models/document.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  title: string;
  content: string;
  owner: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const DocumentSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 0 }
});

export default mongoose.model<IDocument>('Document', DocumentSchema);

