// =========================================================
// SKILLHUB
// CREATE RAZORPAY ORDER
// =========================================================

import Razorpay from "razorpay";

import {
    initializeApp,
    cert,
    getApps
} from "firebase-admin/app";

import {
    getAuth
} from "firebase-admin/auth";

import {
    getFirestore,
    FieldValue
} from "firebase-admin/firestore";


// =========================================================
// FIREBASE ADMIN
// =========================================================

function getFirebaseAdmin() {

    if (!getApps().length) {

        initializeApp({

            credential:
                cert(
                    JSON.parse(
                        process.env.FIREBASE_SERVICE_ACCOUNT_JSON
                    )
                )

        });

    }

}


// =========================================================
// HANDLER
// =========================================================

export default async function handler(
    req,
    res
) {

    if (
        req.method !==
        "POST"
    ) {

        return res
            .status(405)
            .json({
                error:
                    "Method not allowed"
            });

    }


    try {

        getFirebaseAdmin();


        // ---------------------------------
        // AUTHORIZATION
        // ---------------------------------

        const authHeader =
            req.headers.authorization ||
            "";


        if (
            !authHeader.startsWith(
                "Bearer "
            )
        ) {

            return res
                .status(401)
                .json({
                    error:
                        "Login required."
                });

        }


        const idToken =
            authHeader.substring(
                7
            );


        const decodedUser =
            await getAuth()
                .verifyIdToken(
                    idToken
                );


        const uid =
            decodedUser.uid;


        // ---------------------------------
        // FIRESTORE
        // ---------------------------------

        const db =
            getFirestore();


        const userRef =
            db
                .collection("users")
                .doc(uid);


        const userSnapshot =
            await userRef.get();


        if (
            !userSnapshot.exists
        ) {

            return res
                .status(404)
                .json({
                    error:
                        "User profile not found."
                });

        }


        const userData =
            userSnapshot.data();


        // ---------------------------------
        // ALREADY PURCHASED?
        // ---------------------------------

        if (
            userData.courseActive ===
            true &&
            userData.expiryDate
        ) {

            const expiry =
                new Date(
                    userData.expiryDate
                );


            if (
                expiry.getTime() >
                Date.now()
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Your course is already active."
                    });

            }

        }


        // ---------------------------------
        // EMAIL VERIFIED
        // ---------------------------------

        const firebaseUser =
            await getAuth()
                .getUser(
                    uid
                );


        if (
            !firebaseUser.emailVerified
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "Please verify your email before payment."
                });

        }


        // ---------------------------------
        // REFERRAL CODE
        // ---------------------------------

        const body =
            req.body ||
            {};


        let referralCode =
            body.referralCode ||
            userData.referredBy ||
            null;


        if (referralCode) {

            referralCode =
                referralCode
                    .toString()
                    .trim()
                    .toUpperCase();

        }


        let referrerId =
            null;


        if (referralCode) {

            const referrerQuery =
                await db
                    .collection("users")
                    .where(
                        "referralCode",
                        "==",
                        referralCode
                    )
                    .limit(1)
                    .get();


            if (
                !referrerQuery.empty
            ) {

                const referrer =
                    referrerQuery
                        .docs[0];


                referrerId =
                    referrer.id;


                // Self-referral block

                if (
                    referrerId ===
                    uid
                ) {

                    return res
                        .status(400)
                        .json({
                            error:
                                "Self-referral is not allowed."
                        });

                }

            }

        }


        // ---------------------------------
        // RAZORPAY
        // ---------------------------------

        const razorpay =
            new Razorpay({

                key_id:
                    process.env.RAZORPAY_KEY_ID,

                key_secret:
                    process.env.RAZORPAY_KEY_SECRET

            });


        const receipt =
            `skillhub_${uid}_${Date.now()}`;


        const order =
            await razorpay.orders.create({

                amount:
                    19900,

                currency:
                    "INR",

                receipt:
                    receipt,

                notes: {

                    uid:
                        uid,

                    referralCode:
                        referralCode ||
                        "",

                    referrerId:
                        referrerId ||
                        ""

                }

            });


        // ---------------------------------
        // SAVE PENDING ORDER
        // ---------------------------------

        await userRef.set(

            {

                pendingOrderId:
                    order.id,

                pendingReferralCode:
                    referralCode,

                pendingReferrerId:
                    referrerId,

                pendingOrderCreatedAt:
                    FieldValue.serverTimestamp()

            },

            {
                merge:
                    true
            }

        );


        // ---------------------------------
        // RESPONSE
        // ---------------------------------

        return res
            .status(200)
            .json({

                orderId:
                    order.id,

                amount:
                    order.amount,

                currency:
                    order.currency,

                key:
                    process.env.RAZORPAY_KEY_ID

            });


    } catch (error) {

        console.error(
            "Create order error:",
            error
        );


        return res
            .status(500)
            .json({

                error:
                    "Unable to create payment order."

            });

    }

}
