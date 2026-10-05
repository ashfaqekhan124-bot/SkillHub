// =========================================================
// SKILLHUB
// EMAIL AUTHENTICATION + REFERRAL + RAZORPAY
// =========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
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
// INITIALIZE FIREBASE
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
// LOAD LESSONS
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
                ${
                    courseActive
                    ? "Course unlocked • Video will be added later"
                    : "🔒 Locked • Purchase required"
                }
            </p>

        `;

        courseGrid.appendChild(card);

    });

}


// =========================================================
// GENERATE REFERRAL CODE
// =========================================================

function generateReferralCode(uid) {

    const cleanUID =
        uid
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .toUpperCase();

    return (
        "SH" +
        cleanUID.substring(0, 8)
    );

}


// =========================================================
// GET REFERRAL FROM URL
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

    const referral =
        getSavedReferral();

    if (referral) {

        input.value =
            referral;

    }

}


// =========================================================
// OPEN AUTH MODAL
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
// SWITCH LOGIN / SIGNUP
// =========================================================

window.switchAuthMode =
    function() {

        authMode =
            authMode === "signup"
            ? "login"
            : "signup";

        updateAuthMode();

        loadReferralInput();

    };


// =========================================================
// UPDATE AUTH UI
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
// SHOW MESSAGE
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
// SIGN UP
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const createButton =
            document.getElementById(
                "createAccountButton"
            );

        if (!createButton)
            return;


        createButton.addEventListener(
            "click",
            async function() {

                showMessage("");


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
                        .trim()
                        .toLowerCase();


                const password =
                    document
                        .getElementById(
                            "password"
                        )
                        ?.value;


                const referralCode =
                    document
                        .getElementById(
                            "referralInput"
                        )
                        ?.value
                        .trim()
                        .toUpperCase();


                // -----------------------------
                // VALIDATION
                // -----------------------------

                if (!fullName) {

                    showMessage(
                        "Please enter your full name."
                    );

                    return;

                }


                if (!email) {

                    showMessage(
                        "Please enter your email address."
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


                try {

                    createButton.disabled =
                        true;

                    createButton.textContent =
                        "Creating account...";


                    // -----------------------------
                    // CREATE FIREBASE USER
                    // -----------------------------

                    const credential =
                        await createUserWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    const user =
                        credential.user;


                    // -----------------------------
                    // SAVE USER NAME
                    // -----------------------------

                    await updateProfile(
                        user,
                        {

                            displayName:
                                fullName

                        }
                    );


                    // -----------------------------
                    // SEND EMAIL VERIFICATION
                    // -----------------------------

                    await sendEmailVerification(
                        user
                    );


                    // -----------------------------
                    // CREATE REFERRAL CODE
                    // -----------------------------

                    const myReferralCode =
                        generateReferralCode(
                            user.uid
                        );


                    // -----------------------------
                    // SAVE FIRESTORE PROFILE
                    // -----------------------------

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


                    showMessage(
                        "Account created! Please check your email and verify your account before purchasing."
                    );


                    setTimeout(
                        function() {

                            window.closeAuth();

                        },
                        2500
                    );


                } catch (error) {

                    console.error(
                        "Signup error:",
                        error
                    );


                    showMessage(
                        firebaseError(
                            error
                        )
                    );


                } finally {

                    createButton.disabled =
                        false;

                    createButton.textContent =
                        "Create Account";

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

        const loginButton =
            document.getElementById(
                "loginButton"
            );

        if (!loginButton)
            return;


        loginButton.addEventListener(
            "click",
            async function() {

                const email =
                    document
                        .getElementById(
                            "loginEmail"
                        )
                        ?.value
                        .trim()
                        .toLowerCase();


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

                    loginButton.disabled =
                        true;

                    loginButton.textContent =
                        "Logging in...";


                    const credential =
                        await signInWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    const user =
                        credential.user;


                    await user.reload();


                    // User can login,
                    // but purchase requires verification.

                    if (
                        !user.emailVerified
                    ) {

                        showMessage(
                            "Please verify your email before purchasing the course. Check your inbox."
                        );

                    } else {

                        window.closeAuth();

                    }


                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );


                    showMessage(
                        firebaseError(
                            error
                        )
                    );


                } finally {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
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

            loadLessons(false);

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

        await user.reload();


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


        // -----------------------------
        // NAME
        // -----------------------------

        const welcome =
            document.getElementById(
                "dashboardWelcome"
            );


        if (welcome) {

            welcome.textContent =
                `Welcome, ${data.name || user.displayName || "Learner"}`;

        }


        // -----------------------------
        // EMAIL STATUS
        // -----------------------------

        if (
            !user.emailVerified
        ) {

            const status =
                document.getElementById(
                    "courseStatus"
                );

            const expiry =
                document.getElementById(
                    "courseExpiry"
                );

            const purchaseButton =
                document.getElementById(
                    "purchaseCourseButton"
                );


            if (status) {

                status.textContent =
                    "Email Verification Required";

                status.style.color =
                    "#d97706";

            }


            if (expiry) {

                expiry.textContent =
                    "Please verify your email before purchasing the course.";

            }


            if (purchaseButton) {

                purchaseButton.textContent =
                    "Verify Email First";

                purchaseButton.disabled =
                    true;

            }


        }


        // -----------------------------
        // REFERRAL
        // -----------------------------

        const referralCode =
            data.referralCode ||
            generateReferralCode(
                user.uid
            );


        const referralElement =
            document.getElementById(
                "referralCode"
            );


        const dashboardReferral =
            document.getElementById(
                "dashboardReferralCode"
            );


        if (referralElement) {

            referralElement.textContent =
                referralCode;

        }


        if (dashboardReferral) {

            dashboardReferral.textContent =
                referralCode;

        }


        // -----------------------------
        // EARNINGS
        // -----------------------------

        const earnings =
            Number(
                data.totalEarnings ||
                0
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


        // -----------------------------
        // COURSE
        // -----------------------------

        const active =
            user.emailVerified &&
            isCourseActive(
                data
            );


        updateCourseUI(
            data,
            active,
            user.emailVerified
        );


        loadLessons(
            active
        );


        // -----------------------------
        // REFERRALS
        // -----------------------------

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
// COURSE STATUS CHECK
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
// UPDATE COURSE UI
// =========================================================

function updateCourseUI(
    data,
    active,
    verified
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


    if (!verified) {

        if (status) {

            status.textContent =
                "Email Verification Required";

            status.style.color =
                "#d97706";

        }


        if (expiry) {

            expiry.textContent =
                "Verify your email before purchasing the course.";

        }


        if (button) {

            button.textContent =
                "Verify Email First";

            button.disabled =
                true;

        }


        return;

    }


    if (active) {

        if (status) {

            status.textContent =
                "Active";

            status.style.color =
                "#087bf5";

        }


        if (expiry) {

            expiry.textContent =
                `Access available until ${formatDate(
                    new Date(data.expiryDate)
                )}.`;

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
// REFERRAL STATISTICS
// =========================================================

async function loadReferralStats(
    uid
) {

    try {

        const referralsQuery =
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
            await getDocs(
                referralsQuery
            );


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
                    "available"
                    ||
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
                            data.amount ||
                            0
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


        if (
            successfulPurchases
        ) {

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

        await currentUser.reload();


        if (
            !currentUser.emailVerified
        ) {

            alert(
                "Please verify your email before purchasing."
            );

            return;

        }


        const token =
            await currentUser.getIdToken(
                true
            );


        const referralCode =
            getSavedReferral();


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


        const order =
            await response.json();


        if (!response.ok) {

            throw new Error(
                order.error ||
                "Unable to create payment order."
            );

        }


        if (
            typeof Razorpay ===
            "undefined"
        ) {

            throw new Error(
                "Razorpay Checkout could not load."
            );

        }


        const options = {

            key:
                order.key,

            amount:
                order.amount,

            currency:
                "INR",

            name:
                "SkillHub",

            description:
                "SkillHub Course — 1 Year Access",

            order_id:
                order.orderId,


            prefill: {

                name:
                    currentUser.displayName ||
                    "",

                email:
                    currentUser.email ||
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

                ondismiss() {

                    console.log(
                        "Razorpay closed."
                    );

                }

            }

        };


        const razorpay =
            new Razorpay(
                options
            );


        razorpay.on(
            "payment.failed",
            function() {

                alert(
                    "Payment failed. Please try again."
                );

            }
        );


        razorpay.open();


    } catch (error) {

        console.error(
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
            "Payment successful! Your course is active for 1 year."
        );


        localStorage.removeItem(
            "skillhubReferralCode"
        );


        window.location.reload();


    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message
        );

    }

}


// =========================================================
// PURCHASE BUTTON
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
// COPY REFERRAL
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
                    "Referral code is not available."
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
// DATE FORMAT
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
        Number(
            amount || 0
        ).toLocaleString(
            "en-IN"
        )
    );

}


// =========================================================
// FIREBASE ERRORS
// =========================================================

function firebaseError(
    error
) {

    const code =
        error?.code ||
        "";


    switch (code) {

        case "auth/email-already-in-use":

            return "This email is already registered. Please log in.";


        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/weak-password":

            return "Password must contain at least 6 characters.";


        case "auth/invalid-credential":

            return "Incorrect email or password.";


        case "auth/user-not-found":

            return "No account found with this email.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        case "auth/operation-not-allowed":

            return "Email/Password authentication is not enabled in Firebase.";


        default:

            return (
                error?.message ||
                "Something went wrong. Please try again."
            );

    }

}


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadLessons(false);

        getReferralFromURL();

        loadReferralInput();

    }
);


console.log(
    "SkillHub Email Authentication initialized."
);
