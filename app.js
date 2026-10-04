// =========================================================
// SKILLHUB
// Firebase Authentication + Referral + Razorpay Payment
// =========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signInWithEmailAndPassword,
    EmailAuthProvider,
    linkWithCredential,
    updateProfile,
    sendEmailVerification,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    firebaseConfig
} from "./firebase-config.js";


// =========================================================
// FIREBASE
// =========================================================

const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const db =
    getFirestore(firebaseApp);


// =========================================================
// SETTINGS
// =========================================================

const COURSE_PRICE = 199;

let currentUser = null;

let confirmationResult = null;

let recaptchaVerifier = null;

let authMode = "signup";


// =========================================================
// COURSE LESSONS
// =========================================================

const lessons = [

    {
        number: "01",
        title: "Mindset & Motivation",
        description:
            "Build a stronger mindset and understand the importance of taking action."
    },

    {
        number: "02",
        title: "Personal Discipline",
        description:
            "Learn how discipline can improve your daily life and results."
    },

    {
        number: "03",
        title: "Business Ideas",
        description:
            "Understand how to identify useful business opportunities."
    },

    {
        number: "04",
        title: "Understanding Customers",
        description:
            "Learn why customers matter in every successful business."
    },

    {
        number: "05",
        title: "Starting Small",
        description:
            "Learn how to start with limited resources and improve gradually."
    },

    {
        number: "06",
        title: "Digital Skills",
        description:
            "Explore useful digital skills for today's online world."
    },

    {
        number: "07",
        title: "Earning Knowledge",
        description:
            "Understand different digital earning possibilities."
    },

    {
        number: "08",
        title: "Money Management",
        description:
            "Learn basic principles of managing money."
    },

    {
        number: "09",
        title: "Growth & Consistency",
        description:
            "Understand how consistency supports long-term progress."
    },

    {
        number: "10",
        title: "Your Action Plan",
        description:
            "Create a simple plan to apply what you have learned."
    }

];


// =========================================================
// LOAD COURSE
// =========================================================

function loadLessons(courseActive = false) {

    const courseGrid =
        document.querySelector(".course-grid");

    if (!courseGrid) return;


    courseGrid.innerHTML = "";


    lessons.forEach((lesson) => {

        const card =
            document.createElement("div");


        card.className =
            "course-card";


        card.innerHTML = `

            <span>
                LESSON ${lesson.number}
            </span>

            <h3>
                ${lesson.title}
            </h3>

            <p>
                ${courseActive
                    ? "Course unlocked • Video will be added later"
                    : "🔒 Locked • Purchase required"
                }
            </p>

        `;


        courseGrid.appendChild(card);

    });

}


// =========================================================
// REFERRAL CODE
// =========================================================

function generateReferralCode(uid) {

    const cleanUID =
        uid
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .toUpperCase();


    return "SH" +
        cleanUID.substring(0, 8);

}


// =========================================================
// URL REFERRAL
// =========================================================

function getReferralFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const ref =
        params.get("ref");


    if (ref) {

        localStorage.setItem(
            "skillhubReferralCode",
            ref.toUpperCase()
        );

    }


    return ref;

}


// =========================================================
// SAVED REFERRAL
// =========================================================

function getSavedReferral() {

    return localStorage.getItem(
        "skillhubReferralCode"
    );

}


// =========================================================
// REFERRAL INPUT
// =========================================================

function loadReferralInput() {

    const input =
        document.getElementById(
            "referralInput"
        );


    if (!input) return;


    const ref =
        getSavedReferral();


    if (ref) {

        input.value =
            ref;

    }

}


// =========================================================
// OPEN AUTH
// =========================================================

window.openAuth =
    function(mode = "signup") {

        authMode =
            mode;


        const modal =
            document.getElementById(
                "authModal"
            );


        if (!modal) return;


        modal.classList.remove(
            "hidden"
        );


        updateAuthMode();

        loadReferralInput();


        if (
            authMode === "signup"
        ) {

            setupRecaptcha();

        }

    };


// =========================================================
// CLOSE AUTH
// =========================================================

window.closeAuth =
    function() {

        const modal =
            document.getElementById(
                "authModal"
            );


        if (modal) {

            modal.classList.add(
                "hidden"
            );

        }

    };


// =========================================================
// SWITCH AUTH MODE
// =========================================================

window.switchAuthMode =
    function() {

        authMode =
            authMode === "signup"
                ? "login"
                : "signup";


        updateAuthMode();


        if (
            authMode === "signup"
        ) {

            setupRecaptcha();

        }

    };


// =========================================================
// AUTH UI
// =========================================================

function updateAuthMode() {

    const signupForm =
        document.getElementById(
            "signupForm"
        );


    const loginForm =
        document.getElementById(
            "loginForm"
        );


    const title =
        document.getElementById(
            "authTitle"
        );


    const switchText =
        document.getElementById(
            "authSwitchText"
        );


    const switchButton =
        document.getElementById(
            "authSwitchButton"
        );


    if (
        !signupForm ||
        !loginForm ||
        !title ||
        !switchText ||
        !switchButton
    ) {

        return;

    }


    if (
        authMode === "signup"
    ) {

        signupForm.classList.remove(
            "hidden"
        );


        loginForm.classList.add(
            "hidden"
        );


        title.textContent =
            "Create your account";


        switchText.textContent =
            "Already have an account?";


        switchButton.textContent =
            "Log in";


    } else {

        signupForm.classList.add(
            "hidden"
        );


        loginForm.classList.remove(
            "hidden"
        );


        title.textContent =
            "Welcome back";


        switchText.textContent =
            "Don't have an account?";


        switchButton.textContent =
            "Sign Up";

    }

}


// =========================================================
// MESSAGE
// =========================================================

function showMessage(message) {

    const element =
        document.getElementById(
            "authMessage"
        );


    if (element) {

        element.textContent =
            message;

    }

}


// =========================================================
// RECAPTCHA
// =========================================================

async function setupRecaptcha() {

    const container =
        document.getElementById(
            "recaptcha-container"
        );


    if (!container) return;


    if (
        recaptchaVerifier
    ) {

        return;

    }


    try {

        recaptchaVerifier =
            new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {

                    size: "normal",

                    callback() {

                        console.log(
                            "reCAPTCHA verified."
                        );

                    },

                    "expired-callback"() {

                        console.log(
                            "reCAPTCHA expired."
                        );

                    }

                }
            );


        await recaptchaVerifier.render();


    } catch (error) {

        console.error(
            "reCAPTCHA error:",
            error
        );

    }

}


// =========================================================
// SEND OTP
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const button =
            document.getElementById(
                "sendOtpButton"
            );


        if (!button) return;


        button.addEventListener(
            "click",
            async function() {

                const phone =
                    document
                        .getElementById(
                            "phone"
                        )
                        ?.value
                        .trim();


                if (!phone) {

                    showMessage(
                        "Please enter your mobile number."
                    );

                    return;

                }


                if (
                    !phone.startsWith("+")
                ) {

                    showMessage(
                        "Use country code. Example: +919876543210"
                    );

                    return;

                }


                try {

                    button.disabled =
                        true;

                    button.textContent =
                        "Sending OTP...";


                    await setupRecaptcha();


                    confirmationResult =
                        await signInWithPhoneNumber(
                            auth,
                            phone,
                            recaptchaVerifier
                        );


                    document
                        .getElementById(
                            "otpSection"
                        )
                        ?.classList
                        .remove(
                            "hidden"
                        );


                    showMessage(
                        "OTP sent successfully."
                    );


                } catch (error) {

                    console.error(
                        error
                    );


                    showMessage(
                        firebaseError(
                            error
                        )
                    );

                } finally {

                    button.disabled =
                        false;

                    button.textContent =
                        "Send OTP";

                }

            }
        );

    }
);


// =========================================================
// VERIFY OTP + CREATE USER
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const button =
            document.getElementById(
                "verifyOtpButton"
            );


        if (!button) return;


        button.addEventListener(
            "click",
            async function() {

                const fullName =
                    document
                        .getElementById(
                            "fullName"
                        )
                        ?.value
                        .trim();


                const email =
                    document
                        .getElementById(
                            "email"
                        )
                        ?.value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "password"
                        )
                        ?.value;


                const otp =
                    document
                        .getElementById(
                            "otp"
                        )
                        ?.value
                        .trim();


                const referralCode =
                    document
                        .getElementById(
                            "referralInput"
                        )
                        ?.value
                        .trim()
                        .toUpperCase();


                if (!fullName) {

                    showMessage(
                        "Please enter your full name."
                    );

                    return;

                }


                if (!email) {

                    showMessage(
                        "Please enter your email."
                    );

                    return;

                }


                if (
                    password.length < 6
                ) {

                    showMessage(
                        "Password must contain at least 6 characters."
                    );

                    return;

                }


                if (!otp) {

                    showMessage(
                        "Please enter the OTP."
                    );

                    return;

                }


                if (
                    !confirmationResult
                ) {

                    showMessage(
                        "Please request OTP first."
                    );

                    return;

                }


                try {

                    button.disabled =
                        true;

                    button.textContent =
                        "Verifying...";


                    // Verify OTP

                    const result =
                        await confirmationResult.confirm(
                            otp
                        );


                    const user =
                        result.user;


                    // Email + password

                    const emailCredential =
                        EmailAuthProvider.credential(
                            email,
                            password
                        );


                    try {

                        await linkWithCredential(
                            user,
                            emailCredential
                        );

                    } catch (error) {

                        if (
                            error.code !==
                            "auth/provider-already-linked"
                        ) {

                            throw error;

                        }

                    }


                    // User name

                    await updateProfile(
                        user,
                        {
                            displayName:
                                fullName
                        }
                    );


                    // Email verification

                    await sendEmailVerification(
                        user
                    );


                    // Referral code

                    const myReferralCode =
                        generateReferralCode(
                            user.uid
                        );


                    // Firestore user

                    await setDoc(

                        doc(
                            db,
                            "users",
                            user.uid
                        ),

                        {

                            uid:
                                user.uid,

                            name:
                                fullName,

                            email:
                                email,

                            phone:
                                user.phoneNumber,

                            referralCode:
                                myReferralCode,

                            referredBy:
                                referralCode ||
                                null,

                            courseActive:
                                false,

                            purchaseDate:
                                null,

                            expiryDate:
                                null,

                            totalReferrals:
                                0,

                            successfulPurchases:
                                0,

                            pendingEarnings:
                                0,

                            availableEarnings:
                                0,

                            totalEarnings:
                                0,

                            withdrawnAmount:
                                0,

                            createdAt:
                                serverTimestamp()

                        },

                        {
                            merge:
                                true
                        }

                    );


                    localStorage.removeItem(
                        "skillhubReferralCode"
                    );


                    showMessage(
                        "Account created successfully. Verification email sent."
                    );


                    setTimeout(
                        () => {

                            window.closeAuth();

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        error
                    );


                    showMessage(
                        firebaseError(
                            error
                        )
                    );


                } finally {

                    button.disabled =
                        false;

                    button.textContent =
                        "Verify & Create Account";

                }

            }
        );

    }
);


// =========================================================
// LOGIN
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const button =
            document.getElementById(
                "loginButton"
            );


        if (!button) return;


        button.addEventListener(
            "click",
            async function() {

                const email =
                    document
                        .getElementById(
                            "loginEmail"
                        )
                        ?.value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "loginPassword"
                        )
                        ?.value;


                if (!email) {

                    showMessage(
                        "Please enter your email."
                    );

                    return;

                }


                if (!password) {

                    showMessage(
                        "Please enter your password."
                    );

                    return;

                }


                try {

                    button.disabled =
                        true;

                    button.textContent =
                        "Logging in...";


                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                    window.closeAuth();


                } catch (error) {

                    showMessage(
                        firebaseError(
                            error
                        )
                    );

                } finally {

                    button.disabled =
                        false;

                    button.textContent =
                        "Log in";

                }

            }
        );

    }
);


// =========================================================
// AUTH STATE
// =========================================================

onAuthStateChanged(
    auth,
    async function(user) {

        currentUser =
            user;


        const dashboard =
            document.getElementById(
                "dashboard"
            );


        if (!dashboard)
            return;


        if (!user) {

            dashboard.classList.add(
                "hidden"
            );


            loadLessons(
                false
            );


            return;

        }


        dashboard.classList.remove(
            "hidden"
        );


        await loadDashboard(
            user
        );

    }
);


// =========================================================
// LOAD DASHBOARD
// =========================================================

async function loadDashboard(
    user
) {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );


        if (!snapshot.exists())
            return;


        const data =
            snapshot.data();


        // Welcome

        const welcome =
            document.getElementById(
                "dashboardWelcome"
            );


        if (welcome) {

            welcome.textContent =
                `Welcome, ${data.name || user.displayName || "Learner"}`;

        }


        // Referral code

        const referralCode =
            data.referralCode ||
            generateReferralCode(
                user.uid
            );


        document
            .getElementById(
                "referralCode"
            )
            ?.replaceChildren(
                document.createTextNode(
                    referralCode
                )
            );


        document
            .getElementById(
                "dashboardReferralCode"
            )
            ?.replaceChildren(
                document.createTextNode(
                    referralCode
                )
            );


        // Earnings

        const earnings =
            Number(
                data.totalEarnings || 0
            );


        const earningsText =
            formatCurrency(
                earnings
            );


        const totalEarnings =
            document.getElementById(
                "totalEarnings"
            );


        const dashboardEarnings =
            document.getElementById(
                "dashboardEarnings"
            );


        if (totalEarnings) {

            totalEarnings.textContent =
                earningsText;

        }


        if (dashboardEarnings) {

            dashboardEarnings.textContent =
                earningsText;

        }


        // Course status

        const active =
            isCourseActive(
                data
            );


        updateCourseUI(
            data,
            active
        );


        // Course cards

        loadLessons(
            active
        );


        // Referral statistics

        await loadReferralStats(
            user.uid
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


// =========================================================
// COURSE ACTIVE CHECK
// =========================================================

function isCourseActive(
    data
) {

    if (
        data.courseActive !== true
    ) {

        return false;

    }


    if (!data.expiryDate) {

        return false;

    }


    const expiry =
        new Date(
            data.expiryDate
        );


    return (
        expiry.getTime() >
        Date.now()
    );

}


// =========================================================
// COURSE UI
// =========================================================

function updateCourseUI(
    data,
    active
) {

    const status =
        document.getElementById(
            "courseStatus"
        );


    const expiry =
        document.getElementById(
            "courseExpiry"
        );


    const button =
        document.getElementById(
            "purchaseCourseButton"
        );


    if (active) {

        if (status) {

            status.textContent =
                "Active";

            status.style.color =
                "#087bf5";

        }


        if (expiry) {

            expiry.textContent =
                `Access available until ${formatDate(new Date(data.expiryDate))}.`;

        }


        if (button) {

            button.textContent =
                "Course Unlocked";

            button.disabled =
                true;

        }

    } else {

        if (status) {

            status.textContent =
                "Locked";

            status.style.color =
                "#d14343";

        }


        if (expiry) {

            expiry.textContent =
                "Purchase the course to unlock your lessons.";

        }


        if (button) {

            button.textContent =
                `Buy Course — ₹${COURSE_PRICE}`;

            button.disabled =
                false;

        }

    }

}


// =========================================================
// REFERRAL STATS
// =========================================================

async function loadReferralStats(
    uid
) {

    try {

        const q =
            query(
                collection(
                    db,
                    "referrals"
                ),

                where(
                    "referrerId",
                    "==",
                    uid
                )
            );


        const snapshot =
            await getDocs(q);


        let total =
            0;

        let successful =
            0;

        let earnings =
            0;


        snapshot.forEach(
            function(item) {

                const data =
                    item.data();


                total++;


                if (
                    data.status ===
                    "available" ||
                    data.status ===
                    "paid"
                ) {

                    successful++;

                }


                if (
                    data.status !==
                    "reversed"
                ) {

                    earnings +=
                        Number(
                            data.amount || 0
                        );

                }

            }
        );


        const totalReferrals =
            document.getElementById(
                "totalReferrals"
            );


        const successfulPurchases =
            document.getElementById(
                "successfulPurchases"
            );


        const totalEarnings =
            document.getElementById(
                "totalEarnings"
            );


        if (totalReferrals) {

            totalReferrals.textContent =
                total;

        }


        if (successfulPurchases) {

            successfulPurchases.textContent =
                successful;

        }


        if (totalEarnings) {

            totalEarnings.textContent =
                formatCurrency(
                    earnings
                );

        }


    } catch (error) {

        console.error(
            "Referral stats error:",
            error
        );

    }

}


// =========================================================
// BUY COURSE
// =========================================================

async function buyCourse() {

    if (!currentUser) {

        window.openAuth(
            "login"
        );

        return;

    }


    try {

        // Refresh user
        await currentUser.reload();


        if (
            !currentUser.emailVerified
        ) {

            alert(
                "Please verify your email before purchasing the course."
            );

            return;

        }


        const token =
            await currentUser.getIdToken(
                true
            );


        const referralCode =
            getSavedReferral();


        // ---------------------------------
        // CREATE RAZORPAY ORDER
        // ---------------------------------

        const response =
            await fetch(
                "/api/create-order",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify({

                            referralCode:
                                referralCode ||
                                null

                        })

                }
            );


        const orderData =
            await response.json();


        if (!response.ok) {

            throw new Error(
                orderData.error ||
                "Unable to create payment order."
            );

        }


        // ---------------------------------
        // RAZORPAY CHECKOUT
        // ---------------------------------

        const options = {

            key:
                orderData.key,

            amount:
                orderData.amount,

            currency:
                "INR",

            name:
                "SkillHub",

            description:
                "SkillHub Course — 1 Year Access",

            order_id:
                orderData.orderId,

            prefill: {

                name:
                    currentUser.displayName ||
                    "",

                email:
                    currentUser.email ||
                    "",

                contact:
                    currentUser.phoneNumber ||
                    ""

            },

            theme: {

                color:
                    "#087bf5"

            },


            handler:
                async function(payment) {

                    await verifyPayment(
                        payment,
                        token
                    );

                },


            modal: {

                ondismiss:
                    function() {

                        console.log(
                            "Payment popup closed."
                        );

                    }

            }

        };


        if (
            typeof Razorpay ===
            "undefined"
        ) {

            throw new Error(
                "Razorpay Checkout could not load."
            );

        }


        const razorpay =
            new Razorpay(
                options
            );


        razorpay.on(
            "payment.failed",
            function(response) {

                console.error(
                    "Payment failed:",
                    response
                );


                alert(
                    "Payment failed. Please try again."
                );

            }
        );


        razorpay.open();


    } catch (error) {

        console.error(
            "Purchase error:",
            error
        );


        alert(
            error.message
        );

    }

}


// =========================================================
// VERIFY PAYMENT
// =========================================================

async function verifyPayment(
    payment,
    token
) {

    try {

        const response =
            await fetch(
                "/api/verify-payment",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify({

                            razorpay_order_id:
                                payment.razorpay_order_id,

                            razorpay_payment_id:
                                payment.razorpay_payment_id,

                            razorpay_signature:
                                payment.razorpay_signature

                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Payment verification failed."
            );

        }


        alert(
            "Payment successful! Your SkillHub course is now unlocked for 1 year."
        );


        // Remove referral from this browser
        localStorage.removeItem(
            "skillhubReferralCode"
        );


        window.location.reload();


    } catch (error) {

        console.error(
            "Verification error:",
            error
        );


        alert(
            error.message
        );

    }

}


// =========================================================
// BUY BUTTON
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const button =
            document.getElementById(
                "purchaseCourseButton"
            );


        if (!button)
            return;


        button.addEventListener(
            "click",
            buyCourse
        );

    }
);


// =========================================================
// REFERRAL LINK
// =========================================================

window.copyReferralLink =
    async function() {

        if (!currentUser) {

            window.openAuth(
                "signup"
            );

            return;

        }


        try {

            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    )
                );


            if (!snapshot.exists()) {

                alert(
                    "User profile not found."
                );

                return;

            }


            const data =
                snapshot.data();


            const code =
                data.referralCode;


            if (!code) {

                alert(
                    "Referral code not available."
                );

                return;

            }


            const link =
                `${window.location.origin}/?ref=${encodeURIComponent(code)}`;


            await navigator.clipboard.writeText(
                link
            );


            alert(
                "Referral link copied!"
            );


        } catch (error) {

            console.error(
                error
            );


            alert(
                "Unable to copy referral link."
            );

        }

    };


// =========================================================
// LOGOUT
// =========================================================

window.logoutUser =
    async function() {

        try {

            await signOut(
                auth
            );


            window.location.reload();


        } catch (error) {

            console.error(
                error
            );

        }

    };


// =========================================================
// DATE
// =========================================================

function formatDate(
    date
) {

    return date.toLocaleDateString(
        "en-IN",
        {

            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"

        }
    );

}


// =========================================================
// CURRENCY
// =========================================================

function formatCurrency(
    amount
) {

    return (
        "₹" +
        Number(amount || 0)
            .toLocaleString("en-IN")
    );

}


// =========================================================
// FIREBASE ERROR
// =========================================================

function firebaseError(
    error
) {

    const code =
        error?.code ||
        "";


    switch (code) {

        case "auth/invalid-phone-number":

            return "Invalid mobile number.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try later.";


        case "auth/invalid-verification-code":

            return "Invalid OTP.";


        case "auth/code-expired":

            return "OTP expired. Request a new OTP.";


        case "auth/email-already-in-use":

            return "This email is already registered.";


        case "auth/invalid-email":

            return "Please enter a valid email.";


        case "auth/weak-password":

            return "Password should contain at least 6 characters.";


        case "auth/invalid-credential":

            return "Incorrect email or password.";


        default:

            return (
                error?.message ||
                "Something went wrong."
            );

    }

}


// =========================================================
// START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadLessons(false);

        getReferralFromURL();

        loadReferralInput();

    }
);
