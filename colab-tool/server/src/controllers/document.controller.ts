// src/controllers/document.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import Document from "../models/document.model";
import User from "../models/user.model";
import mongoose from "mongoose";

// Create a new document
export const createDocument = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title } = req.body;
    const userId = req.user.id;

    const document = new Document({
      title,
      owner: userId,
      collaborators: [userId], // Owner is also a collaborator
    });

    await document.save();

    res.status(201).json({
      message: "Document created successfully",
      document: {
        id: document._id,
        title: document.title,
        owner: document.owner,
        collaborators: document.collaborators,
      },
    });
  } catch (error) {
    console.error("Create document error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all documents for a user
export const getUserDocuments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;

    // Find documents where user is owner or collaborator
    const documents = await Document.find({
      $or: [{ owner: userId }, { collaborators: userId }],
    }).select("_id title owner collaborators createdAt updatedAt");

    res.json({ documents });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single document by id
export const getDocument = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid document ID" });
      return;
    }

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    // Check if user has access to the document
    if (
      !document.collaborators.includes(new mongoose.Types.ObjectId(userId)) &&
      !document.owner.equals(userId)
    ) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.json({ document });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update document title
export const updateDocumentTitle = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    // Validate document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid document ID" });
      return;
    }

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    // Only the owner can update the title
    if (!document.owner.equals(userId)) {
      res.status(403).json({ message: "Only the owner can update the title" });
      return;
    }

    document.title = title;
    document.updatedAt = new Date();
    await document.save();

    res.json({
      message: "Document title updated successfully",
      document: {
        id: document._id,
        title: document.title,
      },
    });
  } catch (error) {
    console.error("Update document title error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add a collaborator to a document
export const addCollaborator = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    // Validate document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid document ID" });
      return;
    }

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    // Only the owner can add collaborators
    if (!document.owner.equals(userId)) {
      res.status(403).json({ message: "Only the owner can add collaborators" });
      return;
    }

    // Find the user to add as collaborator
    const collaborator: any = await User.findOne({ email });

    if (!collaborator) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if user is already a collaborator
    if (document.collaborators.includes(collaborator._id)) {
      res.status(400).json({ message: "User is already a collaborator" });
      return;
    }

    // Add the collaborator
    document.collaborators.push(collaborator._id);
    document.updatedAt = new Date();
    await document.save();

    res.json({
      message: "Collaborator added successfully",
      collaborator: {
        id: collaborator._id,
        username: collaborator.username,
        email: collaborator.email,
      },
    });
  } catch (error) {
    console.error("Add collaborator error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove a collaborator from a document
export const removeCollaborator = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.id;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(collaboratorId)
    ) {
      res.status(400).json({ message: "Invalid ID format" });
      return;
    }

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    // Only the owner can remove collaborators
    if (!document.owner.equals(userId)) {
      res
        .status(403)
        .json({ message: "Only the owner can remove collaborators" });
      return;
    }

    // Check if collaborator exists
    const collaboratorIndex = document.collaborators.findIndex((collab) =>
      collab.equals(collaboratorId)
    );

    if (collaboratorIndex === -1) {
      res.status(404).json({ message: "Collaborator not found" });
      return;
    }

    // Cannot remove the owner as collaborator
    if (document.owner.toString() === collaboratorId) {
      res
        .status(400)
        .json({ message: "Cannot remove the owner as collaborator" });
      return;
    }

    // Remove the collaborator
    document.collaborators.splice(collaboratorIndex, 1);
    document.updatedAt = new Date();
    await document.save();

    res.json({ message: "Collaborator removed successfully" });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a document
export const deleteDocument = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid document ID" });
      return;
    }

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    // Only the owner can delete the document
    if (!document.owner.equals(userId)) {
      res
        .status(403)
        .json({ message: "Only the owner can delete the document" });
      return;
    }

    await Document.findByIdAndDelete(id);

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
