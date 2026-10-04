// =========================================================
// SKILLHUB
// Firebase Authentication + Referral System
// =========================================================

// Firebase App
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

// Firebase Authentication
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

// Firebase Firestore
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

// Firebase config
import {
    firebaseConfig
} from "./firebase-config.js";


// =========================================================
// INITIALIZE FIREBASE
// =========================================================

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let confirmationResult = null;

let recaptchaVerifier = null;

let currentUser = null;

let authMode = "signup";


// =========================================================
// COURSE INFORMATION
// =========================================================

const COURSE_PRICE = 199;

const REFERRAL_COMMISSION = 100;

const COURSE_DURATION_DAYS = 365;


// =========================================================
// LESSON LIST
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
            "Learn why customers are important for every successful business."
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
            "Learn basic principles of managing personal money."
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

function loadLessons() {

    const courseGrid =
        document.querySelector(".course-grid");

    if (!courseGrid) return;

    courseGrid.innerHTML = "";

    lessons.forEach((lesson) => {

        const card =
            document.createElement("div");

        card.className = "course-card";

        card.innerHTML = `

            <span>
                LESSON ${lesson.number}
            </span>

            <h3>
                ${lesson.title}
            </h3>

            <p>
                ${lesson.description}
            </p>

        `;

        courseGrid.appendChild(card);

    });

}


// =========================================================
// REFERRAL CODE GENERATOR
// =========================================================
//
// Example:
// SH7K92AB
// =========================================================

function generateReferralCode(uid) {

    const cleanUID =
        uid
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase();

    return "SH" +
        cleanUID.substring(0, 8);

}


// =========================================================
// GET REFERRAL FROM URL
// =========================================================
//
// Example:
//
// yourwebsite.com/?ref=SHABC123
// =========================================================

function getReferralFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const referralCode =
        params.get("ref");

    if (referralCode) {

        localStorage.setItem(
            "skillhubReferralCode",
            referralCode
        );

    }

    return referralCode;
}


// =========================================================
// LOAD SAVED REFERRAL
// =========================================================

function getSavedReferralCode() {

    return localStorage.getItem(
        "skillhubReferralCode"
    );

}


// =========================================================
// PUT REFERRAL CODE INTO SIGNUP FIELD
// =========================================================

function loadReferralIntoForm() {

    const referralInput =
        document.getElementById(
            "referralInput"
        );

    if (!referralInput) return;

    const referralCode =
        getSavedReferralCode();

    if (referralCode) {

        referralInput.value =
            referralCode;

    }

}


// =========================================================
// OPEN AUTH MODAL
// =========================================================

window.openAuth = function(mode) {

    authMode = mode;

    const modal =
        document.getElementById(
            "authModal"
        );

    if (!modal) return;

    modal.classList.remove("hidden");

    updateAuthMode();

    loadReferralIntoForm();

    if (mode === "signup") {

        setupRecaptcha();

    }

};


// =========================================================
// CLOSE AUTH MODAL
// =========================================================

window.closeAuth = function() {

    const modal =
        document.getElementById(
            "authModal"
        );

    if (!modal) return;

    modal.classList.add("hidden");

};


// =========================================================
// SWITCH LOGIN / SIGNUP
// =========================================================

window.switchAuthMode = function() {

    authMode =
        authMode === "signup"
            ? "login"
            : "signup";

    updateAuthMode();

    if (authMode === "signup") {

        setupRecaptcha();

    }

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
    ) return;


    if (authMode === "signup") {

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
// AUTH MESSAGE
// =========================================================

function showMessage(message) {

    const box =
        document.getElementById(
            "authMessage"
        );

    if (!box) return;

    box.textContent =
        message;

}


// =========================================================
// CLEAR AUTH MESSAGE
// =========================================================

function clearMessage() {

    const box =
        document.getElementById(
            "authMessage"
        );

    if (!box) return;

    box.textContent = "";

}


// =========================================================
// SETUP RECAPTCHA
// =========================================================
//
// Firebase Phone Auth on web requires
// reCAPTCHA verification.
// =========================================================

async function setupRecaptcha() {

    const container =
        document.getElementById(
            "recaptcha-container"
        );

    if (!container) return;


    // Already initialized
    if (recaptchaVerifier) {

        return;

    }


    try {

        recaptchaVerifier =
            new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {

                    size: "normal",

                    callback: function() {

                        console.log(
                            "reCAPTCHA completed."
                        );

                    },

                    "expired-callback":
                        function() {

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

        const sendOtpButton =
            document.getElementById(
                "sendOtpButton"
            );


        if (
            !sendOtpButton
        ) return;


        sendOtpButton.addEventListener(
            "click",
            async function() {

                clearMessage();


                const phoneInput =
                    document.getElementById(
                        "phone"
                    );

                const phone =
                    phoneInput
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
                        "Please use country code. Example: +919876543210"
                    );

                    return;

                }


                try {

                    sendOtpButton.disabled =
                        true;

                    sendOtpButton.textContent =
                        "Sending OTP...";


                    await setupRecaptcha();


                    confirmationResult =
                        await signInWithPhoneNumber(
                            auth,
                            phone,
                            recaptchaVerifier
                        );


                    const otpSection =
                        document.getElementById(
                            "otpSection"
                        );


                    if (otpSection) {

                        otpSection.classList.remove(
                            "hidden"
                        );

                    }


                    showMessage(
                        "OTP sent successfully. Check your mobile."
                    );


                } catch (error) {

                    console.error(
                        error
                    );


                    showMessage(
                        getFirebaseErrorMessage(
                            error
                        )
                    );


                    resetRecaptcha();


                } finally {

                    sendOtpButton.disabled =
                        false;

                    sendOtpButton.textContent =
                        "Send OTP";

                }

            }
        );

    }
);


// =========================================================
// RESET RECAPTCHA
// =========================================================

function resetRecaptcha() {

    if (!recaptchaVerifier) return;


    try {

        recaptchaVerifier.clear();

    } catch (error) {

        console.log(error);

    }


    recaptchaVerifier =
        null;


    setTimeout(
        function() {

            setupRecaptcha();

        },
        500
    );

}


// =========================================================
// VERIFY OTP
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const verifyOtpButton =
            document.getElementById(
                "verifyOtpButton"
            );


        if (!verifyOtpButton)
            return;


        verifyOtpButton.addEventListener(
            "click",
            async function() {

                clearMessage();


                if (
                    !confirmationResult
                ) {

                    showMessage(
                        "Please request the OTP first."
                    );

                    return;

                }


                const otp =
                    document
                        .getElementById(
                            "otp"
                        )
                        ?.value
                        .trim();


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
                        "Password must be at least 6 characters."
                    );

                    return;

                }


                if (!otp) {

                    showMessage(
                        "Please enter the OTP."
                    );

                    return;

                }


                try {

                    verifyOtpButton.disabled =
                        true;

                    verifyOtpButton.textContent =
                        "Verifying...";


                    // Verify phone OTP
                    const result =
                        await confirmationResult.confirm(
                            otp
                        );


                    const user =
                        result.user;


                    // ---------------------------------
                    // LINK EMAIL + PASSWORD
                    // ---------------------------------

                    const credential =
                        EmailAuthProvider.credential(
                            email,
                            password
                        );


                    try {

                        await linkWithCredential(
                            user,
                            credential
                        );

                    } catch (linkError) {

                        console.error(
                            "Email linking error:",
                            linkError
                        );


                        // If email already linked
                        if (
                            linkError.code !==
                            "auth/provider-already-linked"
                        ) {

                            throw linkError;

                        }

                    }


                    // ---------------------------------
                    // UPDATE PROFILE
                    // ---------------------------------

                    await updateProfile(
                        user,
                        {
                            displayName:
                                fullName
                        }
                    );


                    // ---------------------------------
                    // SEND EMAIL VERIFICATION
                    // ---------------------------------

                    await sendEmailVerification(
                        user
                    );


                    // ---------------------------------
                    // CREATE REFERRAL CODE
                    // ---------------------------------

                    const myReferralCode =
                        generateReferralCode(
                            user.uid
                        );


                    // ---------------------------------
                    // SAVE USER
                    // ---------------------------------

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
                            merge: true
                        }

                    );


                    // Save referral code
                    // locally for convenience
                    localStorage.setItem(
                        "skillhubMyReferralCode",
                        myReferralCode
                    );


                    showMessage(
                        "Account created successfully. Verification email sent."
                    );


                    setTimeout(
                        function() {

                            closeAuth();

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        error
                    );


                    showMessage(
                        getFirebaseErrorMessage(
                            error
                        )
                    );


                } finally {

                    verifyOtpButton.disabled =
                        false;

                    verifyOtpButton.textContent =
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

        const loginButton =
            document.getElementById(
                "loginButton"
            );


        if (!loginButton)
            return;


        loginButton.addEventListener(
            "click",
            async function() {

                clearMessage();


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

                    loginButton.disabled =
                        true;

                    loginButton.textContent =
                        "Logging in...";


                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                    closeAuth();


                } catch (error) {

                    console.error(
                        error
                    );


                    showMessage(
                        getFirebaseErrorMessage(
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


        if (user) {

            dashboard.classList.remove(
                "hidden"
            );


            await loadUserDashboard(
                user
            );


        } else {

            dashboard.classList.add(
                "hidden"
            );

        }

    }
);


// =========================================================
// LOAD USER DASHBOARD
// =========================================================

async function loadUserDashboard(
    user
) {

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (!userSnapshot.exists()) {

            return;

        }


        const data =
            userSnapshot.data();


        // ---------------------------------
        // Welcome
        // ---------------------------------

        const welcome =
            document.getElementById(
                "dashboardWelcome"
            );


        if (welcome) {

            welcome.textContent =
                `Welcome, ${data.name || user.displayName || "Learner"}`;

        }


        // ---------------------------------
        // Referral code
        // ---------------------------------

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


        // ---------------------------------
        // Earnings
        // ---------------------------------

        const totalEarnings =
            Number(
                data.totalEarnings || 0
            );


        const earningsElement =
            document.getElementById(
                "totalEarnings"
            );


        const dashboardEarnings =
            document.getElementById(
                "dashboardEarnings"
            );


        if (earningsElement) {

            earningsElement.textContent =
                formatCurrency(
                    totalEarnings
                );

        }


        if (dashboardEarnings) {

            dashboardEarnings.textContent =
                formatCurrency(
                    totalEarnings
                );

        }


        // ---------------------------------
        // Referral stats
        // ---------------------------------

        await loadReferralStats(
            user.uid
        );


        // ---------------------------------
        // Course status
        // ---------------------------------

        updateCourseStatus(
            data
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


// =========================================================
// COURSE STATUS
// =========================================================

function updateCourseStatus(
    data
) {

    const status =
        document.getElementById(
            "courseStatus"
        );


    const expiryText =
        document.getElementById(
            "courseExpiry"
        );


    const purchaseButton =
        document.getElementById(
            "purchaseCourseButton"
        );


    if (
        !status ||
        !expiryText
    ) return;


    let active =
        data.courseActive === true;


    let expiryDate =
        null;


    if (data.expiryDate) {

        expiryDate =
            new Date(
                data.expiryDate
            );

        if (
            expiryDate <=
            new Date()
        ) {

            active =
                false;

        }

    }


    if (active) {

        status.textContent =
            "Active";

        status.style.color =
            "#087bf5";


        if (expiryDate) {

            expiryText.textContent =
                `Your course access is active until ${formatDate(expiryDate)}.`;

        } else {

            expiryText.textContent =
                "Your course access is active.";

        }


        if (purchaseButton) {

            purchaseButton.textContent =
                "Course Unlocked";

            purchaseButton.disabled =
                true;

        }

    } else {

        status.textContent =
            "Locked";

        status.style.color =
            "#d14343";


        expiryText.textContent =
            "Purchase the course to unlock your lessons.";


        if (purchaseButton) {

            purchaseButton.textContent =
                `Buy Course — ₹${COURSE_PRICE}`;

            purchaseButton.disabled =
                false;

        }

    }

}


// =========================================================
// LOAD REFERRAL STATS
// =========================================================

async function loadReferralStats(
    uid
) {

    try {

        const referralsRef =
            collection(
                db,
                "referrals"
            );


        const referralQuery =
            query(
                referralsRef,
                where(
                    "referrerId",
                    "==",
                    uid
                )
            );


        const snapshot =
            await getDocs(
                referralQuery
            );


        let total =
            0;

        let successful =
            0;

        let earnings =
            0;


        snapshot.forEach(
            function(docSnapshot) {

                const data =
                    docSnapshot.data();


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
// COPY REFERRAL LINK
// =========================================================

window.copyReferralLink =
    async function() {

        if (!currentUser) {

            openAuth(
                "signup"
            );

            return;

        }


        try {

            const userSnapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    )
                );


            if (
                !userSnapshot.exists()
            ) {

                return;

            }


            const data =
                userSnapshot.data();


            const referralCode =
                data.referralCode;


            if (!referralCode) {

                alert(
                    "Referral code is not available yet."
                );

                return;

            }


            const referralLink =
                `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`;


            await navigator.clipboard.writeText(
                referralLink
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


            alert(
                "You have been logged out."
            );


        } catch (error) {

            console.error(
                error
            );

        }

    };


// =========================================================
// PURCHASE BUTTON
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const purchaseButton =
            document.getElementById(
                "purchaseCourseButton"
            );


        if (!purchaseButton)
            return;


        purchaseButton.addEventListener(
            "click",
            async function() {

                if (!currentUser) {

                    openAuth(
                        "login"
                    );

                    return;

                }


                // Email verification
                // will be required before payment.

                await currentUser.reload();


                if (
                    !currentUser.emailVerified
                ) {

                    alert(
                        "Please verify your email before purchasing the course."
                    );

                    return;

                }


                alert(
                    "Payment gateway will be connected in Step 4."
                );

            }
        );

    }
);


// =========================================================
// FORMAT CURRENCY
// =========================================================

function formatCurrency(
    amount
) {

    return "₹" +
        Number(amount || 0)
            .toLocaleString("en-IN");

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(
    date
) {

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


// =========================================================
// FIREBASE ERROR HANDLER
// =========================================================

function getFirebaseErrorMessage(
    error
) {

    if (!error)
        return "Something went wrong.";


    const code =
        error.code || "";


    switch (code) {

        case "auth/invalid-phone-number":

            return "Invalid mobile number. Use +91 followed by your number.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        case "auth/invalid-verification-code":

            return "Invalid OTP. Please check the code.";


        case "auth/code-expired":

            return "OTP has expired. Please request a new OTP.";


        case "auth/email-already-in-use":

            return "This email is already registered.";


        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/weak-password":

            return "Password is too weak. Use at least 6 characters.";


        case "auth/invalid-credential":

            return "Incorrect email or password.";


        case "auth/user-not-found":

            return "No account found with this email.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/provider-already-linked":

            return "This account is already connected with email/password.";


        case "auth/account-exists-with-different-credential":

            return "An account already exists with this information.";


        case "auth/operation-not-allowed":

            return "This Firebase authentication method is not enabled.";


        default:

            return (
                error.message ||
                "Something went wrong. Please try again."
            );

    }

}


// =========================================================
// INITIAL PAGE SETUP
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadLessons();

        getReferralFromURL();

        loadReferralIntoForm();

    }
);


// =========================================================
// DEBUG
// =========================================================

console.log(
    "SkillHub Firebase initialized successfully."
);
