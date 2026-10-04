// =========================================================
// SKILLHUB
// VERIFY RAZORPAY PAYMENT
// =========================================================

import crypto from "crypto";

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
        // AUTH
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
        // PAYMENT DATA
        // ---------------------------------

        const {

            razorpay_order_id:
                orderId,

            razorpay_payment_id:
                paymentId,

            razorpay_signature:
                signature

        } =
            req.body ||
            {};


        if (
            !orderId ||
            !paymentId ||
            !signature
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "Incomplete payment information."
                });

        }


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
        // TRUSTED ORDER CHECK
        // ---------------------------------

        if (
            userData.pendingOrderId !==
            orderId
        ) {

            return res
                .status(400)
                .json({
                    error:
                        "Invalid or expired payment order."
                });

        }


        // ---------------------------------
        // SIGNATURE
        // ---------------------------------

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    `${orderId}|${paymentId}`
                )
                .digest("hex");


        const valid =
            crypto.timingSafeEqual(

                Buffer.from(
                    generatedSignature,
                    "utf8"
                ),

                Buffer.from(
                    signature,
                    "utf8"
                )

            );


        if (!valid) {

            return res
                .status(400)
                .json({
                    error:
                        "Payment signature verification failed."
                });

        }


        // ---------------------------------
        // DUPLICATE PROTECTION
        // ---------------------------------

        const paymentRef =
            db
                .collection("payments")
                .doc(paymentId);


        const existingPayment =
            await paymentRef.get();


        if (
            existingPayment.exists
        ) {

            return res
                .status(200)
                .json({
                    message:
                        "Payment was already processed."
                });

        }


        // ---------------------------------
        // ONE-YEAR EXPIRY
        // ---------------------------------

        const purchaseDate =
            new Date();


        const expiryDate =
            new Date(
                purchaseDate
            );


        expiryDate.setFullYear(
            expiryDate.getFullYear() +
            1
        );


        // ---------------------------------
        // REFERRAL
        // ---------------------------------

        const referrerId =
            userData.pendingReferrerId ||
            null;


        const referralCode =
            userData.pendingReferralCode ||
            null;


        // ---------------------------------
        // PAYMENT RECORD
        // ---------------------------------

        const paymentRecord = {

            paymentId:
                paymentId,

            orderId:
                orderId,

            userId:
                uid,

            amount:
                199,

            currency:
                "INR",

            status:
                "paid",

            refundStatus:
                "none",

            referralCode:
                referralCode,

            referrerId:
                referrerId,

            purchaseDate:
                purchaseDate.toISOString(),

            createdAt:
                FieldValue.serverTimestamp()

        };


        // ---------------------------------
        // SAVE PAYMENT
        // ---------------------------------

        await paymentRef.set(
            paymentRecord
        );


        // ---------------------------------
        // ACTIVATE COURSE
        // ---------------------------------

        await userRef.set(

            {

                courseActive:
                    true,

                purchaseDate:
                    purchaseDate.toISOString(),

                expiryDate:
                    expiryDate.toISOString(),

                paymentId:
                    paymentId,

                orderId:
                    orderId,

                pendingOrderId:
                    null,

                pendingReferralCode:
                    null,

                pendingReferrerId:
                    null

            },

            {
                merge:
                    true
            }

        );


        // ---------------------------------
        // REFERRAL COMMISSION
        // ---------------------------------

        if (
            referrerId &&
            referrerId !== uid
        ) {

            const referralId =
                `${referrerId}_${uid}`;


            const referralRef =
                db
                    .collection("referrals")
                    .doc(
                        referralId
                    );


            const referralSnapshot =
                await referralRef.get();


            // Prevent duplicate referral commission

            if (
                !referralSnapshot.exists
            ) {

                await referralRef.set({

                    referralId:
                        referralId,

                    referrerId:
                        referrerId,

                    referredUserId:
                        uid,

                    referralCode:
                        referralCode,

                    amount:
                        100,

                    status:
                        "available",

                    paymentId:
                        paymentId,

                    orderId:
                        orderId,

                    createdAt:
                        FieldValue.serverTimestamp()

                });


                // Update referrer earnings

                const referrerRef =
                    db
                        .collection("users")
                        .doc(
                            referrerId
                        );


                const referrerSnapshot =
                    await referrerRef.get();


                if (
                    referrerSnapshot.exists
                ) {

                    const referrerData =
                        referrerSnapshot.data();


                    const oldEarnings =
                        Number(
                            referrerData.totalEarnings ||
                            0
                        );


                    const oldAvailable =
                        Number(
                            referrerData.availableEarnings ||
                            0
                        );


                    const oldPurchases =
                        Number(
                            referrerData.successfulPurchases ||
                            0
                        );


                    const oldReferrals =
                        Number(
                            referrerData.totalReferrals ||
                            0
                        );


                    await referrerRef.set(

                        {

                            totalEarnings:
                                oldEarnings + 100,

                            availableEarnings:
                                oldAvailable + 100,

                            successfulPurchases:
                                oldPurchases + 1,

                            totalReferrals:
                                oldReferrals + 1

                        },

                        {
                            merge:
                                true
                        }

                    );

                }

            }

        }


        // ---------------------------------
        // SUCCESS
        // ---------------------------------

        return res
            .status(200)
            .json({

                success:
                    true,

                message:
                    "Payment successful. Your course is active for 1 year.",

                purchaseDate:
                    purchaseDate.toISOString(),

                expiryDate:
                    expiryDate.toISOString()

            });


    } catch (error) {

        console.error(
            "Verify payment error:",
            error
        );


        return res
            .status(500)
            .json({

                error:
                    "Payment verification failed."

            });

    }

}
