const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema({
  sections: [
    {
      type: {
        type: String,
        required: true,
      },

      position: {
        type: Number,
        required: true,
      },

      /* ===========================
         TEXT CONTENT (i18n)
      =========================== */
      title: {
        ar: { type: String, default: "" },
        en: { type: String, default: "" },
      },

      subtitle: {
        ar: { type: String, default: "" },
        en: { type: String, default: "" },
      },

      /* ===========================
         IMAGE
      =========================== */
      image: {
        type: String,
        default: "",
      },

      /* ===========================
         BUTTON STYLE
      =========================== */
      button: {
        bgColor: {
          type: String,
          default: "#000000",
        },
      },

      /* ===========================
         TEXT COLORS
      =========================== */
      textColors: {
        title: {
          type: String,
          default: "#000000",
        },
        subtitle: {
          type: String,
          default: "#666666",
        },
        buttonText: {
          type: String,
          default: "#ffffff",
        },
      },
    },
  ],
});

module.exports = mongoose.model("Setting", SettingSchema);