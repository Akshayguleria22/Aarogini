import express from "express";
import { runDoctorAI } from "../services/doctorAi.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/consult", protect, async (req, res) => {

    try {

        const { symptoms } = req.body;

        const result = await runDoctorAI(symptoms, req.user);

        res.json({
            success: true,
            data: result
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Doctor AI failed"
        });
    }
});
export default router;
