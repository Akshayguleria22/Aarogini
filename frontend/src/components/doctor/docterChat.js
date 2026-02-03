import { useState } from "react";

export default function DoctorChat() {

    const [symptoms, setSymptoms] = useState("");
    const [result, setResult] = useState(null);

    async function consult() {

        const res = await fetch("/api/doctor/consult", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.token}`
            },
            body: JSON.stringify({ symptoms })
        });

        const data = await res.json();

        setResult(data.data);
    }

    return (
        <div className="max-w-xl mx-auto p-4">

            <h2 className="text-2xl font-bold mb-3">
                ChatVeda – AI Doctor
            </h2>

            <textarea
                className="w-full border p-3 rounded"
                rows="4"
                placeholder="Describe your symptoms..."
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
            />

            <button
                onClick={consult}
                className="mt-3 bg-purple-600 text-white px-4 py-2 rounded"
            >
                Consult AI Doctor
            </button>

            {result && (

                <div className="mt-5 bg-white p-4 rounded shadow">

                    <h3 className="font-semibold">Possible Conditions</h3>
                    {result.aiResult.possibleConditions.map((c, i) => (
                        <p key={i}>• {c}</p>
                    ))}

                    <p className="mt-2">
                        <b>Severity:</b> {result.aiResult.severity}
                    </p>

                    <h4 className="mt-2 font-semibold">Recommendations</h4>
                    {result.aiResult.recommendations.map((r, i) => (
                        <p key={i}>✅ {r}</p>
                    ))}

                </div>
            )}

        </div>
    );
}
