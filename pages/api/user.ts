import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	// if using `NEXTAUTH_SECRET` env variable, we detect it, and you won't actually need to `secret`
	// const token = await getToken({ req })
	const token = await getToken({ req, raw: false });
	console.log("token: ", token);

	res.status(200).send({ ...token });
}
