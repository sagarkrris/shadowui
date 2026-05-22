import { getCompanyPrep } from "../../lib/companyPrep.mjs";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(getCompanyPrep(req.query.company));
}
