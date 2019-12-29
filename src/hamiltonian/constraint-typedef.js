/** An array containing parameter values for each {@link CellKind}.
 * Each element in the array is a non-negative number, and the value for
 * CellKind k is stored in array[k].
 * @example
 * // V[0] is for the background, V[1] for the first real cellkind.
 * let V = [0,500]
 * @typedef {number[]} PerKindNonNegative
 * */

/** An array containing parameter values for each {@link CellKind}.
 * Each element in the array is a number between 0 and 1, and the value for
 * CellKind k is stored in array[k].
 * @example
 * // PERSIST[0] is for the background
 * // PERSIST[1] for the first real cellkind.
 * let PERSIST = [0,0.8]
 * @typedef {number[]} PerKindProb
 * */

/** An array containing parameter values for each {@link CellKind}.
 * Each element in the array is an array of some length, and the array for
 * CellKind k is stored in array[k].
 * @example
 * let LAMBDA_ACT_MBG = [[0,0],[0,0],[800,100]]
 * @typedef {number[]} PerKindArray */

/** An array containing parameter values for each {@link CellKind}.
 * Each element in the array is a boolean, and the value for CellKind k is
 * stored in array[k].
 * @example
 * // IS_BARRIER[0] is for the background; cellkind 1 is the "barrier"
 * // and 2 is a real cell.
 * let IS_BARRIER = [false,true,false]
 * @typedef {boolean[]} PerKindBoolean */

/** An array of arrays containing interaction parameter values for each
 * {@link CellKind} - combination. Each element in the array is a non-negative
 * number, and X[n][m] contains the value for an interaction between cellkinds
 * n and m.
 * @example
 * // J[0][0] between two background pixels is always zero.
 * // Not that it matters, because the background has a
 * // single cellid of zero -- so there are no pairs
 * // of background pixels from different cells anyway.
 * let J = [[0,20],[20,10]]
 * @typedef {number[]} CellKindInteractionMatrix */