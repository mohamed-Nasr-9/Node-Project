import mongoose from "mongoose";

const { Schema } = mongoose;

const ImageSchema = new Schema(
  { url: { type: String, default: "" }, key: String },
  { _id: false }
);

const BookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    reserved: { type: Number, min: 0, default: 0 },
    ratingAvg: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },
    image: ImageSchema,
    pdfUrl: { type: String, default: "" },
    isbn: { type: String, default: "" },
    sku: { type: String, default: "" },
    publisher: { type: String, default: "" },
    language: { type: String, default: "" },
    publishedAt: { type: Date, default: Date.now },

    authors: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Author" }],
      required: true,
      default: []
    },
    categories: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      default: []
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ----------------------------------------------------------------
   Indexes to support filtering, search, and sorting efficiently
------------------------------------------------------------------*/

// Text search on title + description for `?q=`
BookSchema.index({ title: "text", description: "text" }, { default_language: 'none' });

// ⚡ Common filter fields
BookSchema.index({ authors: 1 });
BookSchema.index({ categories: 1 });
BookSchema.index({ price: 1 });
BookSchema.index({ isActive: 1 });

//  Compound index for faster default sort queries (active + createdAt desc)
BookSchema.index({ isActive: 1, createdAt: -1 });

//  Optional: sort + filter by rating or stock in future features
BookSchema.index({ ratingAvg: -1 });
BookSchema.index({ stock: 1, reserved: 1 });

export default mongoose.model("Book", BookSchema);