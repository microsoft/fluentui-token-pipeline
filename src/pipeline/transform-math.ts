export type TransformMatrix = [ a: number, b: number, c: number, d: number, tx: number, ty: number ]

export interface TransformOperations
{
	translateX: number
	translateY: number
	rotate: number
	scaleX: number
	scaleY: number
	skewX: number
	skewY: number
}

/**
	Given an array in the format accepted by the CSS matrix() function, calculates a set of individual translation,
	rotation, scale, and skew operations that would produce the same result.
 	@param matrix A six-element array of numbers: [ a, b, c, d, tx, ty ].
	@returns An object of the form { translateX, translateY, rotate, scaleX, scaleY, skewX, skewY }, with angles expressed in radians.
*/
export const decomposeTransformMatrix = (matrix: TransformMatrix): TransformOperations =>
{
	// QR-like matrix decomposition
	// Inspired by https://frederic-wang.fr/decomposition-of-2d-transform-matrices.html
	// License: "Feel free to copy it on MDN or anywhere else."

	const [a, b, c, d, tx, ty] = matrix

	if (a !== 0 || b !== 0)
	{
		const r = Math.sqrt(a * a + b * b)
		const delta = a * d - b * c
		return {
			translateX: tx,
			translateY: ty,
			rotate: b > 0 ? Math.acos(a / r) : -Math.acos(a / r),
			scaleX: r,
			scaleY: delta / r,
			skewX: Math.atan((a * c + b * d) / (r * r)),
			skewY: 0,
		}
	}
	else if (c !== 0 || d !== 0)
	{
		const s = Math.sqrt(c * c + d * d)
		const delta = a * d - b * c
		return {
			translateX: tx,
			translateY: ty,
			rotate: Math.PI / 2 - (d > 0 ? Math.acos(-c / s) : -Math.acos(c / s)),
			scaleX: delta / s,
			scaleY: s,
			skewX: 0,
			skewY: Math.atan((a * c + b * d) / (s * s)),
		}
	}
	else
	{
		return 	{
			translateX: tx,
			translateY: ty,
			rotate: 0,
			scaleX: 1,
			scaleY: 1,
			skewX: 0,
			skewY: 0,
		}
	}
}

/**
	Converts an angle from degrees to radians.
 	@param degrees An angle expressed in degrees.
	@returns The same angle expressed in radians.
*/
export const radians = (deg: number): number => deg * Math.PI / 180

/**
	Converts an angle from radians to degrees.
 	@param radians An angle expressed in radians.
	@returns The same angle expressed in degrees.
*/
export const degrees = (rad: number): number => rad * 180 / Math.PI

const areTransformsEqual = (a: TransformOperations, b: TransformOperations): boolean =>
{
	return (
		a.translateX === b.translateX &&
		a.translateY === b.translateY &&
		a.rotate === b.rotate &&
		a.scaleX === b.scaleX &&
		a.scaleY === b.scaleY &&
		a.skewX === b.skewX &&
		a.skewY === b.skewY
	)
}

// ------------------------------------------------------------
// Test cases
// ------------------------------------------------------------

// const testTransform = (input: TransformMatrix, expected: TransformOperations): void =>
// {
// 	const operations = decomposeTransformMatrix(input)
// 	if (areTransformsEqual(operations, expected))
// 	{
// 		console.log("✅", input, JSON.stringify(expected))
// 	}
// 	else
// 	{
// 		console.error("❌", input, JSON.stringify(operations), "should be", JSON.stringify(expected))
// 	}
// }

// console.log("Matrix decomposition test cases")
// testTransform([1, 0, 0, 1, -40, 0], { translateX: -40, translateY: 0, rotate: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 })
// testTransform([-2, 0, 0, 1, 0, 0], { translateX: 0, translateY: 0, rotate: radians(-180), scaleX: 2, scaleY: -1, skewX: 0, skewY: 0 })
// testTransform([.5, 0, 0, 1.5, 30, -20], { translateX: 30, translateY: -20, rotate: 0, scaleX: 0.5, scaleY: 1.5, skewX: 0, skewY: 0 })
