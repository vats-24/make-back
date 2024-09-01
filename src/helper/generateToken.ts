import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface User {
	id: string;
	email: string;
	name: string;
}

export const generateAccessAndRefreshTokens = async (user: User) => {
	const refreshToken = jwt.sign({ id: user.id }, env.REFRESH_JWT_SECRET, {
		expiresIn: env.REFRESH_JWT_EXPIRY,
	});
	const accessToken = jwt.sign(
		{
			id: user.id,
			email: user.email,
		},
		env.ACCESS_JWT_SECRET,
		{ expiresIn: env.ACCESS_JWT_EXPIRY },
	);

	const normalToken = jwt.sign({id: user.id},env.JWT_SECRET, {
		expiresIn: env.JWT_EXPIRY
	})

    return {accessToken,refreshToken,normalToken}
};
