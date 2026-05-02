const mongoose = require('mongoose');
const httpStatusText = require('../httpStatusText');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const userRoles = require('../user.roles');
const fs = require('fs');
const path = require('path');
const upload = require('../Middlewares/uploadImage');
const cloudinary = require("../config/cloudinary");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const Setting = require('../Models/Settings.model');

/* ===========================
   GET SETTINGS
=========================== */
const getSettings = async (req, res) => {
  const settings = await Setting.findOne();

  res.json({
    status: "success",
    data: settings?.sections || [],
  });
};

/* ===========================
   UPSERT SETTINGS
=========================== */

const upsertHero = async (req, res) => {
  try {
    const { position } = req.body;

    const pos = Number(position);

    if (!pos || isNaN(pos)) {
      return res.status(400).json({
        message: "position is required",
      });
    }

    /* ===========================
       GET OR CREATE SETTINGS
    =========================== */
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({ sections: [] });
    }

    if (!Array.isArray(settings.sections)) {
      settings.sections = [];
    }

    /* ===========================
       IMAGE UPLOAD
    =========================== */
    const file = req.file;

    let imageUrl;

    if (file?.buffer) {
      const upload = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        {
          folder: "settings",
        }
      );

      imageUrl = upload.secure_url;
    }

    console.log("FILE:", file);
    console.log("BODY:", req.body);

    /* ===========================
       BUILD HERO DATA
    =========================== */
    const heroData = {
      type: "hero",
      position: pos,

      image: imageUrl,

      title: {
        ar: req.body.title_ar || "",
        en: req.body.title_en || "",
      },

      subtitle: {
        ar: req.body.subtitle_ar || "",
        en: req.body.subtitle_en || "",
      },

      /* ===========================
         BUTTON COLORS
      =========================== */
      button: {
        bgColor: req.body.buttonBgColor || "#000000",
      },

      /* ===========================
         TEXT COLORS
      =========================== */
      textColors: {
        title: req.body.titleColor || "#000000",
        subtitle: req.body.subtitleColor || "#666666",
        buttonText: req.body.buttonTextColor || "#ffffff",
      },
    };

    /* ===========================
       FIND EXISTING HERO
    =========================== */
    const index = settings.sections.findIndex(
      (s) => s.type === "hero" && s.position === pos
    );

    /* ===========================
       UPDATE OR CREATE
    =========================== */
    if (index !== -1) {
      settings.sections[index] = {
        ...settings.sections[index],
        ...heroData,

        // keep old image if no new one uploaded
        image: imageUrl || settings.sections[index].image,
      };
    } else {
      settings.sections.push(heroData);
    }

    /* ===========================
       REMOVE DUPLICATES
    =========================== */
    const unique = [];
    const seen = new Set();

    for (const s of settings.sections) {
      if (s.type === "hero") {
        if (!seen.has(s.position)) {
          unique.push(s);
          seen.add(s.position);
        }
      } else {
        unique.push(s);
      }
    }

    settings.sections = unique;

    /* ===========================
       SORT HEROES
    =========================== */
    settings.sections.sort((a, b) => {
      if (a.type === "hero" && b.type === "hero") {
        return a.position - b.position;
      }
      return 0;
    });

    /* ===========================
       SAVE
    =========================== */
    await settings.save();

    return res.json({
      status: "success",
      data: settings.sections,
    });

  } catch (err) {
    console.log("upsertHero error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

//* ===========================
//*    GET HERO BY POSITION
//* ===========================

const getHeroByPosition = async (req, res) => {
  try {
    const { position } = req.params;

    const settings = await Setting.findOne();

    if (!settings) {
      return res.json({ data: null });
    }

    const hero = settings.sections.find(
      (s) => s.type === "hero" && s.position === Number(position)
    );

    return res.json({
      status: "success",
      data: hero || null,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

/* ===========================
   UPDATE HERO
=========================== */

const updateHero = async (req, res) => {
  try {
    const position = Number(req.body.position);

    if (!position || isNaN(position)) {
      return res.status(400).json({ message: "position is required" });
    }

    let settings = await Setting.findOne();

    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    const index = settings.sections.findIndex(
      (s) => s.type === "hero" && s.position === position
    );

    if (index === -1) {
      return res.status(404).json({ message: "Hero not found" });
    }

    const hero = settings.sections[index];

    /* ===========================
       IMAGE (optional)
    =========================== */
    if (req.file?.buffer) {
      const upload = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "settings" }
      );

      hero.image = upload.secure_url;
    }

    /* ===========================
       TITLE (partial safe update)
    =========================== */
    hero.title = {
      ar: req.body.title_ar ?? hero.title?.ar ?? "",
      en: req.body.title_en ?? hero.title?.en ?? "",
    };

    /* ===========================
       SUBTITLE (ALLOW EMPTY)
    =========================== */
    hero.subtitle = {
      ar: req.body.subtitle_ar ?? hero.subtitle?.ar ?? "",
      en: req.body.subtitle_en ?? hero.subtitle?.en ?? "",
    };

    /* ===========================
       COLORS (safe merge)
    =========================== */
    hero.textColors = {
      title: req.body.titleColor ?? hero.textColors?.title ?? "#000000",
      subtitle: req.body.subtitleColor ?? hero.textColors?.subtitle ?? "#666666",
      buttonText: req.body.buttonTextColor ?? hero.textColors?.buttonText ?? "#ffffff",
    };

    hero.button = {
      bgColor: req.body.buttonBgColor ?? hero.button?.bgColor ?? "#000000",
    };

    /* ===========================
       SAVE BACK
    =========================== */
    settings.sections[index] = hero;

    await settings.save();

    return res.json({
      status: "success",
      data: hero,
    });

  } catch (err) {
    console.log("updateHero error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  getSettings,
  upsertHero,
  getHeroByPosition,
  updateHero,
};