import { useEffect, useMemo, useState } from "react";
import "./App.css";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8001";

const civicIssues = [
  {
    icon: "🗑️",
    title: "Garbage Overflow",
    description:
      "Report garbage accumulation or uncollected waste.",
  },
  {
    icon: "🕳️",
    title: "Pothole / Road Damage",
    description:
      "Report potholes or damaged roads.",
  },
  {
    icon: "💧",
    title: "Water Leakage",
    description:
      "Report leaking pipes or water wastage.",
  },
  {
    icon: "💡",
    title: "Damaged Streetlight",
    description:
      "Report broken or non-working streetlights.",
  },
];

const statusOptions = [
  "Submitted",
  "In Progress",
  "Resolved",
  "Rejected",
];

function App() {
  // =======================================================
  // AUTH
  // =======================================================

  const [loggedIn, setLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [authMode, setAuthMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // =======================================================
  // CITIZEN
  // =======================================================

  const [selectedIssue, setSelectedIssue] = useState(null);

  const [formData, setFormData] = useState({
    description: "",
    email: "",
    mobile: "",
    location: "",
    latitude: "",
    longitude: "",
  });

  const [image, setImage] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [myComplaints, setMyComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState("");

  // =======================================================
  // STAFF
  // =======================================================

  const [adminComplaints, setAdminComplaints] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // =======================================================
  // SUMMARY
  // =======================================================

  const [summary, setSummary] = useState({
    total_complaints: 0,
    high_priority: 0,
    in_progress: 0,
    resolved: 0,
    submitted: 0,
    rejected: 0,
    department_counts: {},
  });

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // =======================================================
  // ANALYTICS
  // =======================================================

  const [analytics, setAnalytics] = useState({
    summary: {
      total_complaints: 0,
      resolved_complaints: 0,
      submitted_complaints: 0,
      in_progress_complaints: 0,
      resolution_rate: 0,
      most_common_issue: null,
      highest_workload_department: null,
    },
    by_category: {},
    by_department: {},
    by_priority: {},
    by_status: {},
    recent_complaints: [],
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  // =======================================================
  // MAP
  // =======================================================

  const [mapComplaints, setMapComplaints] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");
  const [selectedMapComplaint, setSelectedMapComplaint] =
    useState(null);

  // =======================================================
  // DETAILS + HISTORY
  // =======================================================

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailError, setDetailError] = useState("");

  const [complaintHistory, setComplaintHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // =======================================================
  // FILTERS
  // =======================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // =======================================================
  // AUTH HEADERS
  // =======================================================

  const getAuthHeaders = () => {
    if (!authToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${authToken}`,
    };
  };

  // =======================================================
  // LOGIN
  // =======================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    const enteredEmail = email.trim().toLowerCase();

    if (!enteredEmail || !password) {
      setLoginError(
        "Please enter your email and password."
      );
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: enteredEmail,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.detail ||
            result.message ||
            "Invalid email or password."
        );
      }

      if (!result.token || !result.user) {
        throw new Error(
          "Authentication response is incomplete."
        );
      }

      setAuthToken(result.token);
      setCurrentUser(result.user);
      setLoggedIn(true);

      setFormData((previous) => ({
        ...previous,
        email: result.user.email,
      }));

      localStorage.setItem(
        "smart_city_token",
        result.token
      );

      localStorage.setItem(
        "smart_city_user",
        JSON.stringify(result.user)
      );
    } catch (error) {
      console.error("Login error:", error);

      setLoginError(
        error.message ||
          "Unable to sign in."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // =======================================================
  // REGISTER
  // =======================================================

  const handleRegister = async (event) => {
    event.preventDefault();

    const name = fullName.trim();
    const newEmail = registerEmail.trim().toLowerCase();

    if (
      !name ||
      !newEmail ||
      !registerPassword ||
      !confirmPassword
    ) {
      setRegisterError(
        "Please complete all fields."
      );
      return;
    }

    if (registerPassword.length < 8) {
      setRegisterError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (registerPassword !== confirmPassword) {
      setRegisterError(
        "Passwords do not match."
      );
      return;
    }

    setRegisterLoading(true);
    setRegisterError("");
    setRegisterSuccess("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: name,
            email: newEmail,
            password: registerPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
            "Unable to create account."
        );
      }

      setRegisterSuccess(
        "Account created successfully. You can now sign in."
      );

      setEmail(newEmail);
      setPassword("");

      setFullName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");

      setAuthMode("login");
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setRegisterError(
        error.message ||
          "Unable to create account."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  // =======================================================
  // RESTORE SESSION
  // =======================================================

  useEffect(() => {
    const savedToken =
      localStorage.getItem(
        "smart_city_token"
      );

    const savedUser =
      localStorage.getItem(
        "smart_city_user"
      );

    if (savedToken && savedUser) {
      try {
        const user =
          JSON.parse(savedUser);

        setAuthToken(savedToken);
        setCurrentUser(user);
        setLoggedIn(true);

        setFormData((previous) => ({
          ...previous,
          email: user.email,
        }));
      } catch {
        localStorage.removeItem(
          "smart_city_token"
        );

        localStorage.removeItem(
          "smart_city_user"
        );
      }
    }
  }, []);

  // =======================================================
  // CITIZEN COMPLAINTS
  // =======================================================

  const loadMyComplaints = async () => {
    if (!currentUser?.email) {
      return;
    }

    setComplaintsLoading(true);
    setComplaintsError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/complaints/user/${encodeURIComponent(
          currentUser.email
        )}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            ...getAuthHeaders(),
            "Cache-Control": "no-cache",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load complaints."
        );
      }

      setMyComplaints(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Citizen complaints error:",
        error
      );

      setMyComplaints([]);
      setComplaintsError(
        error.message ||
          "Unable to load your complaints."
      );
    } finally {
      setComplaintsLoading(false);
    }
  };

  // =======================================================
  // STAFF COMPLAINTS
  // =======================================================

  const loadAdminComplaints = async () => {
    if (
      !currentUser ||
      (
        currentUser.role !== "admin" &&
        currentUser.role !== "officer"
      )
    ) {
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/admin/complaints`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            ...getAuthHeaders(),
            "Cache-Control": "no-cache",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load complaints."
        );
      }

      setAdminComplaints(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Staff complaints error:",
        error
      );

      setAdminError(
        error.message ||
          "Unable to load complaints."
      );
    } finally {
      setAdminLoading(false);
    }
  };

  // =======================================================
  // SUMMARY
  // =======================================================

  const loadSummary = async () => {
    if (
      !currentUser ||
      (
        currentUser.role !== "admin" &&
        currentUser.role !== "officer"
      )
    ) {
      return;
    }

    setSummaryLoading(true);
    setSummaryError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/admin/summary`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            ...getAuthHeaders(),
            "Cache-Control": "no-cache",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load dashboard summary."
        );
      }

      setSummary({
        total_complaints:
          Number(data.total_complaints || 0),
        high_priority:
          Number(data.high_priority || 0),
        in_progress:
          Number(data.in_progress || 0),
        resolved:
          Number(data.resolved || 0),
        submitted:
          Number(data.submitted || 0),
        rejected:
          Number(data.rejected || 0),
        department_counts:
          data.department_counts || {},
      });
    } catch (error) {
      console.error(
        "Summary loading error:",
        error
      );

      setSummaryError(
        error.message ||
          "Unable to load dashboard summary."
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  // =======================================================
  // ANALYTICS
  // =======================================================

  const loadAnalytics = async () => {
    if (
      !currentUser ||
      (
        currentUser.role !== "admin" &&
        currentUser.role !== "officer"
      )
    ) {
      return;
    }

    setAnalyticsLoading(true);
    setAnalyticsError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/admin/analytics`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            ...getAuthHeaders(),
            "Cache-Control": "no-cache",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail ||
            "Unable to load analytics."
        );
      }

      setAnalytics({
        summary: data.summary || {
          total_complaints: 0,
          resolved_complaints: 0,
          submitted_complaints: 0,
          in_progress_complaints: 0,
          resolution_rate: 0,
          most_common_issue: null,
          highest_workload_department: null,
        },
        by_category: data.by_category || {},
        by_department: data.by_department || {},
        by_priority: data.by_priority || {},
        by_status: data.by_status || {},
        recent_complaints: data.recent_complaints || [],
      });
    } catch (error) {
      console.error(
        "Analytics loading error:",
        error
      );

      setAnalyticsError(
        error.message ||
          "Unable to load analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // =======================================================
  // MAP DATA
  // =======================================================

  const loadMapComplaints = async () => {
    if (
      !currentUser ||
      (
        currentUser.role !== "admin" &&
        currentUser.role !== "officer"
      )
    ) {
      return;
    }

    setMapLoading(true);
    setMapError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/admin/map`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            ...getAuthHeaders(),
            "Cache-Control": "no-cache",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load complaint map."
        );
      }

      setMapComplaints(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Map loading error:",
        error
      );

      setMapError(
        error.message ||
          "Unable to load complaint locations."
      );
    } finally {
      setMapLoading(false);
    }
  };

  // =======================================================
  // DETAIL + HISTORY
  // =======================================================

  const loadComplaintDetails = async (
    complaintId
  ) => {
    setDetailError("");
    setHistoryError("");
    setHistoryLoading(true);

    const complaintFromList =
      adminComplaints.find(
        (complaint) =>
          complaint.complaint_id ===
          complaintId
      );

    if (!complaintFromList) {
      setSelectedComplaint(null);
      setComplaintHistory([]);
      setDetailError(
        "Complaint details are not available in the current list."
      );
      setHistoryLoading(false);
      return;
    }

    setSelectedComplaint(
      complaintFromList
    );

    try {
      const response = await fetch(
        `${BACKEND_URL}/admin/complaints/${encodeURIComponent(
          complaintId
        )}/history`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setComplaintHistory([]);
        setHistoryError(
          data.detail ||
            "Unable to load status history."
        );
        return;
      }

      setComplaintHistory(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "History loading error:",
        error
      );

      setComplaintHistory([]);
      setHistoryError(
        "Unable to load status history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // =======================================================
  // IMAGE
  // =======================================================

  const getComplaintImageUrl = (
    imagePath
  ) => {
    if (!imagePath) {
      return null;
    }

    const normalizedPath =
      imagePath.replaceAll(
        "\\",
        "/"
      );

    const filename =
      normalizedPath.split("/").pop();

    if (!filename) {
      return null;
    }

    return (
      `${BACKEND_URL}/uploads/complaints/` +
      encodeURIComponent(filename)
    );
  };

  // =======================================================
  // MAP OPEN
  // =======================================================

  const openComplaintLocation = () => {
    if (!selectedComplaint) {
      return;
    }

    if (
      selectedComplaint.latitude ===
        null ||
      selectedComplaint.latitude ===
        undefined ||
      selectedComplaint.longitude ===
        null ||
      selectedComplaint.longitude ===
        undefined
    ) {
      alert(
        "Location coordinates are not available."
      );
      return;
    }

    const mapUrl =
      `https://www.google.com/maps/search/?api=1&query=${selectedComplaint.latitude},${selectedComplaint.longitude}`;

    window.open(
      mapUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =======================================================
  // MAP MARKER POSITION
  //
  // This uses a simple coordinate-to-screen
  // visualization. It does not require another
  // frontend mapping package.
  // =======================================================

  const getMarkerPosition = (
    complaint
  ) => {
    const validComplaints =
      mapComplaints.filter(
        (item) =>
          Number.isFinite(
            Number(item.latitude)
          ) &&
          Number.isFinite(
            Number(item.longitude)
          )
      );

    if (validComplaints.length === 0) {
      return {
        left: "50%",
        top: "50%",
      };
    }

    const latitudes =
      validComplaints.map(
        (item) =>
          Number(item.latitude)
      );

    const longitudes =
      validComplaints.map(
        (item) =>
          Number(item.longitude)
      );

    const minLat =
      Math.min(...latitudes);

    const maxLat =
      Math.max(...latitudes);

    const minLng =
      Math.min(...longitudes);

    const maxLng =
      Math.max(...longitudes);

    const latRange =
      maxLat - minLat || 0.001;

    const lngRange =
      maxLng - minLng || 0.001;

    const x =
      ((Number(complaint.longitude) -
        minLng) /
        lngRange) *
        80 +
      10;

    const y =
      90 -
      ((Number(complaint.latitude) -
        minLat) /
        latRange) *
        80;

    return {
      left: `${Math.max(
        5,
        Math.min(95, x)
      )}%`,
      top: `${Math.max(
        5,
        Math.min(95, y)
      )}%`,
    };
  };

  // =======================================================
  // FILTER OPTIONS
  // =======================================================

  const categoryOptions =
    useMemo(() => {
      const values =
        adminComplaints
          .map(
            (complaint) =>
              complaint.category
          )
          .filter(Boolean);

      return [
        "All",
        ...new Set(values),
      ];
    }, [adminComplaints]);

  const departmentOptions =
    useMemo(() => {
      const values =
        adminComplaints
          .map(
            (complaint) =>
              complaint.department
          )
          .filter(Boolean);

      return [
        "All",
        ...new Set(values),
      ];
    }, [adminComplaints]);

  const priorityOptions =
    useMemo(() => {
      const values =
        adminComplaints
          .map(
            (complaint) =>
              complaint.priority
          )
          .filter(Boolean);

      return [
        "All",
        ...new Set(values),
      ];
    }, [adminComplaints]);

  // =======================================================
  // FILTERED COMPLAINTS
  // =======================================================

  const filteredAdminComplaints =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      return adminComplaints.filter(
        (complaint) => {
          const searchableText =
            [
              complaint.complaint_id,
              complaint.user_name,
              complaint.email,
              complaint.mobile,
              complaint.category,
              complaint.description,
              complaint.department,
              complaint.location_text,
              complaint.status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return (
            (!query ||
              searchableText.includes(
                query
              )) &&
            (
              categoryFilter ===
                "All" ||
              complaint.category ===
                categoryFilter
            ) &&
            (
              departmentFilter ===
                "All" ||
              complaint.department ===
                departmentFilter
            ) &&
            (
              priorityFilter ===
                "All" ||
              complaint.priority ===
                priorityFilter
            ) &&
            (
              statusFilter ===
                "All" ||
              complaint.status ===
                statusFilter
            )
          );
        }
      );
    }, [
      adminComplaints,
      searchTerm,
      categoryFilter,
      departmentFilter,
      priorityFilter,
      statusFilter,
    ]);

  // =======================================================
  // CLEAR FILTERS
  // =======================================================

  const clearAdminFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All");
    setDepartmentFilter("All");
    setPriorityFilter("All");
    setStatusFilter("All");
  };

  // =======================================================
  // FORM HELPERS
  // =======================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      setImage(file);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setFormData((previous) => ({
          ...previous,
          latitude,
          longitude,
          location:
            `${latitude}, ${longitude}`,
        }));
      },
      () => {
        alert(
          "Unable to get your location."
        );
      }
    );
  };

  // =======================================================
  // RESET FORM
  // =======================================================

  const resetComplaintForm = () => {
    setSelectedIssue(null);

    setFormData({
      description: "",
      email:
        currentUser?.email ||
        "",
      mobile: "",
      location: "",
      latitude: "",
      longitude: "",
    });

    setImage(null);
    setSubmissionResult(null);
  };

  // =======================================================
  // SUBMIT COMPLAINT
  // =======================================================

  const submitComplaint = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedIssue) {
      alert(
        "Please select a civic issue."
      );
      return;
    }

    if (
      !formData.description.trim()
    ) {
      alert(
        "Please enter a complaint description."
      );
      return;
    }

    if (!image) {
      alert(
        "Please upload an image."
      );
      return;
    }

    if (
      !formData.mobile.trim()
    ) {
      alert(
        "Please enter your mobile number."
      );
      return;
    }

    setIsSubmitting(true);

    const complaintData =
      new FormData();

    complaintData.append(
      "user_name",
      currentUser?.full_name ||
        "Citizen"
    );

    complaintData.append(
      "email",
      currentUser?.email ||
        ""
    );

    complaintData.append(
      "mobile",
      formData.mobile.trim()
    );

    complaintData.append(
      "category",
      selectedIssue.title
    );

    complaintData.append(
      "description",
      formData.description.trim()
    );

    complaintData.append(
      "location_text",
      formData.location
    );

    if (
      formData.latitude !== ""
    ) {
      complaintData.append(
        "latitude",
        formData.latitude
      );
    }

    if (
      formData.longitude !== ""
    ) {
      complaintData.append(
        "longitude",
        formData.longitude
      );
    }

    complaintData.append(
      "image",
      image
    );

    try {
      const response =
        await fetch(
          `${BACKEND_URL}/complaints/`,
          {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
            },
            body: complaintData,
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.detail ||
            result.message ||
            "Unable to submit complaint."
        );
      }

      setSubmissionResult(
        result
      );

      await loadMyComplaints();
    } catch (error) {
      console.error(
        "Complaint submission error:",
        error
      );

      alert(
        error.message ||
          "Unable to submit complaint."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =======================================================
  // UPDATE STATUS
  // =======================================================

  const updateComplaintStatus =
    async (
      complaintId,
      newStatus
    ) => {
      try {
        const response =
          await fetch(
            `${BACKEND_URL}/admin/complaints/${encodeURIComponent(
              complaintId
            )}/status?status=${encodeURIComponent(
              newStatus
            )}`,
            {
              method: "PUT",
              headers: {
                ...getAuthHeaders(),
              },
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.detail ||
              result.message ||
              "Unable to update complaint."
          );
        }

        setAdminComplaints(
          (previous) =>
            previous.map(
              (complaint) =>
                complaint.complaint_id ===
                complaintId
                  ? {
                      ...complaint,
                      status:
                        newStatus,
                    }
                  : complaint
            )
        );

        await loadSummary();
        await loadMapComplaints();

        if (
          selectedComplaint &&
          selectedComplaint.complaint_id ===
            complaintId
        ) {
          setSelectedComplaint(
            (previous) => ({
              ...previous,
              status:
                newStatus,
            })
          );

          try {
            const historyResponse =
              await fetch(
                `${BACKEND_URL}/admin/complaints/${encodeURIComponent(
                  complaintId
                )}/history`,
                {
                  method: "GET",
                  cache: "no-store",
                  headers: {
                    ...getAuthHeaders(),
                  },
                }
              );

            const historyData =
              await historyResponse.json();

            if (
              historyResponse.ok
            ) {
              setComplaintHistory(
                Array.isArray(
                  historyData
                )
                  ? historyData
                  : []
              );

              setHistoryError("");
            } else {
              setHistoryError(
                historyData.detail ||
                  "Unable to refresh status history."
              );
            }
          } catch {
            setHistoryError(
              "Unable to refresh status history."
            );
          }
        }
      } catch (error) {
        console.error(
          "Status update error:",
          error
        );

        alert(
          error.message ||
            "Unable to update status."
        );
      }
    };

  // =======================================================
  // LOGOUT
  // =======================================================

  const logout = () => {
    localStorage.removeItem(
      "smart_city_token"
    );

    localStorage.removeItem(
      "smart_city_user"
    );

    setLoggedIn(false);
    setAuthToken("");
    setCurrentUser(null);

    setEmail("");
    setPassword("");

    setMyComplaints([]);
    setAdminComplaints([]);

    setSelectedComplaint(null);
    setComplaintHistory([]);

    setSelectedMapComplaint(null);
    setMapComplaints([]);

    setSelectedIssue(null);
    setSubmissionResult(null);

    clearAdminFilters();
  };

  // =======================================================
  // AUTO LOAD
  // =======================================================

  useEffect(() => {
    if (
      loggedIn &&
      currentUser?.role ===
        "citizen"
    ) {
      loadMyComplaints();
    }
  }, [
    loggedIn,
    currentUser,
  ]);

  useEffect(() => {
    if (
      loggedIn &&
      (
        currentUser?.role === "admin" ||
        currentUser?.role === "officer"
      )
    ) {
      loadAdminComplaints();
      loadSummary();
      loadAnalytics();
      loadMapComplaints();
    }
  }, [
    loggedIn,
    currentUser,
  ]);

  // =======================================================
  // LOGIN / REGISTER SCREEN
  // =======================================================

  if (!loggedIn) {
    return (
      <div className="login-page">

        <div className="login-card">

          <div className="logo-circle">
            🏙️
          </div>

          <h1>
            Smart City AI
          </h1>

          <p className="login-subtitle">
            AI-Powered Civic Complaint Management
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            }}
          >

            <button
              type="button"
              className={
                authMode ===
                "login"
                  ? "report-button"
                  : "cancel-button"
              }
              onClick={() => {
                setAuthMode(
                  "login"
                );
                setLoginError("");
                setRegisterError("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={
                authMode ===
                "register"
                  ? "report-button"
                  : "cancel-button"
              }
              onClick={() => {
                setAuthMode(
                  "register"
                );
                setLoginError("");
                setRegisterError("");
              }}
            >
              Create Account
            </button>

          </div>

          {authMode ===
          "login" ? (

            <form
              onSubmit={
                handleLogin
              }
            >

              <label>
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
              />

              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

              {loginError && (
                <p
                  style={{
                    color: "red",
                  }}
                >
                  {
                    loginError
                  }
                </p>
              )}

              {registerSuccess && (
                <p
                  style={{
                    color: "green",
                  }}
                >
                  {
                    registerSuccess
                  }
                </p>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={
                  loginLoading
                }
              >
                {
                  loginLoading
                    ? "Signing in..."
                    : "Login"
                }
              </button>

            </form>

          ) : (

            <form
              onSubmit={
                handleRegister
              }
            >

              <label>
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
              />

              <label>
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={
                  registerEmail
                }
                onChange={(event) =>
                  setRegisterEmail(
                    event.target.value
                  )
                }
              />

              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="At least 8 characters"
                value={
                  registerPassword
                }
                onChange={(event) =>
                  setRegisterPassword(
                    event.target.value
                  )
                }
              />

              <label>
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Repeat your password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
              />

              {registerError && (
                <p
                  style={{
                    color: "red",
                  }}
                >
                  {
                    registerError
                  }
                </p>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={
                  registerLoading
                }
              >
                {
                  registerLoading
                    ? "Creating..."
                    : "Create Account"
                }
              </button>

            </form>
          )}

        </div>

      </div>
    );
  }

  // =======================================================
  // STAFF DETAIL
  // =======================================================

  if (
    (
      currentUser?.role ===
        "admin" ||
      currentUser?.role ===
        "officer"
    ) &&
    selectedComplaint
  ) {
    const imageUrl =
      getComplaintImageUrl(
        selectedComplaint.image_path
      );

    const hasCoordinates =
      selectedComplaint.latitude !==
        null &&
      selectedComplaint.latitude !==
        undefined &&
      selectedComplaint.longitude !==
        null &&
      selectedComplaint.longitude !==
        undefined;

    return (
      <div className="dashboard">

        <header className="topbar">

          <div className="brand">

            <span className="brand-icon">
              🏙️
            </span>

            <span>
              Smart City AI
            </span>

          </div>

          <div className="profile">

            <span>
              {
                currentUser.full_name
              }
            </span>

            <button onClick={logout}>
              Logout
            </button>

          </div>

        </header>

        <main className="dashboard-content">

          <button
            type="button"
            className="back-button"
            onClick={() => {
              setSelectedComplaint(null);
              setComplaintHistory([]);
              setHistoryError("");
            }}
          >
            ← Back to Complaints
          </button>

          <section className="recent-section">

            <h2>
              Complaint Details
            </h2>

            {detailError && (
              <div className="empty-state">
                <h4>
                  {detailError}
                </h4>
              </div>
            )}

            <div className="result-card">

              <div className="result-row">
                <span>
                  Complaint ID
                </span>

                <strong>
                  {
                    selectedComplaint.complaint_id
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Citizen
                </span>

                <strong>
                  {
                    selectedComplaint.user_name ||
                    "Citizen"
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Email
                </span>

                <strong>
                  {
                    selectedComplaint.email
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Mobile
                </span>

                <strong>
                  {
                    selectedComplaint.mobile
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Category
                </span>

                <strong>
                  {
                    selectedComplaint.category
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Priority
                </span>

                <strong>
                  {
                    selectedComplaint.priority
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Department
                </span>

                <strong>
                  {
                    selectedComplaint.department
                  }
                </strong>
              </div>

              <div className="result-row">

                <span>
                  Status
                </span>

                <select
                  value={
                    selectedComplaint.status
                  }
                  onChange={(event) =>
                    updateComplaintStatus(
                      selectedComplaint.complaint_id,
                      event.target.value
                    )
                  }
                >

                  {statusOptions.map(
                    (status) => (
                      <option
                        key={
                          status
                        }
                        value={
                          status
                        }
                      >
                        {
                          status
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="result-row">

                <span>
                  Location
                </span>

                <strong>
                  {
                    selectedComplaint.location_text ||
                    "Not provided"
                  }
                </strong>

              </div>

              <div className="result-row">

                <span>
                  Latitude
                </span>

                <strong>
                  {
                    selectedComplaint.latitude ??
                    "Not available"
                  }
                </strong>

              </div>

              <div className="result-row">

                <span>
                  Longitude
                </span>

                <strong>
                  {
                    selectedComplaint.longitude ??
                    "Not available"
                  }
                </strong>

              </div>

              {hasCoordinates && (
                <div className="result-row">

                  <span>
                    Map Location
                  </span>

                  <button
                    type="button"
                    className="report-button"
                    onClick={
                      openComplaintLocation
                    }
                  >
                    Open Location
                  </button>

                </div>
              )}

              <div className="result-row">

                <span>
                  Created
                </span>

                <strong>
                  {
                    selectedComplaint.created_at
                      ? new Date(
                          selectedComplaint.created_at
                        ).toLocaleString()
                      : "Not available"
                  }
                </strong>

              </div>

            </div>

            <div className="ai-response-card">

              <h3>
                Complaint Description
              </h3>

              <p>
                {
                  selectedComplaint.description
                }
              </p>

            </div>

            {selectedComplaint.ai_response && (
              <div className="ai-response-card">

                <h3>
                  AI Assessment
                </h3>

                <p>
                  {
                    selectedComplaint.ai_response
                  }
                </p>

              </div>
            )}

            {imageUrl && (
              <div className="ai-response-card">

                <h3>
                  Submitted Evidence
                </h3>

                <img
                  src={imageUrl}
                  alt="Citizen submitted evidence"
                  style={{
                    width: "100%",
                    maxWidth: "700px",
                    borderRadius: "12px",
                    display: "block",
                  }}
                />

              </div>
            )}

            <div className="ai-response-card">

              <h3>
                Status History
              </h3>

              <p>
                Record of status changes for this complaint.
              </p>

              {historyLoading ? (

                <div
                  style={{
                    marginTop: "15px",
                  }}
                >
                  Loading status history...
                </div>

              ) : historyError ? (

                <div
                  style={{
                    marginTop: "15px",
                  }}
                >

                  <strong>
                    {
                      historyError
                    }
                  </strong>

                </div>

              ) : complaintHistory.length === 0 ? (

                <div
                  style={{
                    marginTop: "15px",
                    padding: "15px",
                    borderRadius: "10px",
                    background: "#f8f9fa",
                  }}
                >
                  No status changes recorded yet.
                </div>

              ) : (

                <div
                  style={{
                    marginTop: "15px",
                    display: "grid",
                    gap: "12px",
                  }}
                >

                  {complaintHistory.map(
                    (history) => (

                      <div
                        key={
                          history.id
                        }
                        style={{
                          padding: "15px",
                          border:
                            "1px solid #e5e7eb",
                          borderRadius: "10px",
                          background: "#ffffff",
                        }}
                      >

                        <strong>
                          {
                            history.old_status ||
                            "Initial"
                          }
                          {" → "}
                          {
                            history.new_status
                          }
                        </strong>

                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "14px",
                          }}
                        >
                          Changed by:{" "}
                          <strong>
                            {
                              history.changed_by_name
                            }
                          </strong>
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "14px",
                          }}
                        >
                          Email:{" "}
                          {
                            history.changed_by_email
                          }
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "13px",
                            opacity: 0.7,
                          }}
                        >
                          {
                            history.created_at
                              ? new Date(
                                  history.created_at
                                ).toLocaleString()
                              : "Time unavailable"
                          }
                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </section>

        </main>

      </div>
    );
  }

  // =======================================================
  // STAFF DASHBOARD
  // =======================================================

  if (
    currentUser?.role ===
      "admin" ||
    currentUser?.role ===
      "officer"
  ) {

    const departmentEntries =
      Object.entries(
        summary.department_counts ||
          {}
      );

    return (
      <div className="dashboard">

        <header className="topbar">

          <div className="brand">

            <span className="brand-icon">
              🏙️
            </span>

            <span>
              Smart City AI
            </span>

          </div>

          <div className="profile">

            <span>
              {
                currentUser.full_name
              }
            </span>

            <button onClick={logout}>
              Logout
            </button>

          </div>

        </header>

        <main className="dashboard-content">

          <section className="welcome-section">

            <div>

              <h2>
                {
                  currentUser.role ===
                    "officer"
                    ? "Department Dashboard"
                    : "Admin Dashboard"
                }
              </h2>

              <p>
                {
                  currentUser.department
                    ? `Department: ${currentUser.department}`
                    : "Municipal complaint overview"
                }
              </p>

            </div>

            <div className="status-card">

              <span className="status-number">
                {
                  filteredAdminComplaints.length
                }
              </span>

              <span>
                Matching Complaints
              </span>

            </div>

          </section>

          {/* =================================================
              SUMMARY CARDS
             ================================================= */}

          <section className="issue-grid">

            <div className="issue-card">

              <div className="issue-icon">
                📋
              </div>

              <h4>
                Total Complaints
              </h4>

              <div
                style={{
                  fontSize: "30px",
                  fontWeight: "700",
                  margin: "10px 0",
                }}
              >
                {
                  summaryLoading
                    ? "..."
                    : summary.total_complaints
                }
              </div>

              <p>
                All complaints available to your account.
              </p>

            </div>

            <div className="issue-card">

              <div className="issue-icon">
                🚨
              </div>

              <h4>
                High Priority
              </h4>

              <div
                style={{
                  fontSize: "30px",
                  fontWeight: "700",
                  margin: "10px 0",
                }}
              >
                {
                  summaryLoading
                    ? "..."
                    : summary.high_priority
                }
              </div>

              <p>
                Complaints requiring urgent attention.
              </p>

            </div>

            <div className="issue-card">

              <div className="issue-icon">
                🔄
              </div>

              <h4>
                In Progress
              </h4>

              <div
                style={{
                  fontSize: "30px",
                  fontWeight: "700",
                  margin: "10px 0",
                }}
              >
                {
                  summaryLoading
                    ? "..."
                    : summary.in_progress
                }
              </div>

              <p>
                Complaints currently being handled.
              </p>

            </div>

            <div className="issue-card">

              <div className="issue-icon">
                ✅
              </div>

              <h4>
                Resolved
              </h4>

              <div
                style={{
                  fontSize: "30px",
                  fontWeight: "700",
                  margin: "10px 0",
                }}
              >
                {
                  summaryLoading
                    ? "..."
                    : summary.resolved
                }
              </div>

              <p>
                Complaints successfully completed.
              </p>

            </div>

          </section>

          {/* =================================================
              AI ANALYTICS
             ================================================= */}

          <section
            className="recent-section"
            style={{
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              padding: "24px",
              marginTop: "24px",
            }}
          >
            {/* Header */}

            <div
              className="admin-header"
              style={{
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#e0ecff",
                      fontSize: "20px",
                    }}
                  >
                    📊
                  </div>

                  <div>
                    <h3 style={{ margin: 0 }}>
                      AI Analytics
                    </h3>

                    <p
                      className="section-subtitle"
                      style={{ marginTop: "4px" }}
                    >
                      Real-time insights from civic complaints
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="report-button"
                onClick={loadAnalytics}
                disabled={analyticsLoading}
              >
                {analyticsLoading
                  ? "Refreshing..."
                  : "Refresh Analytics"}
              </button>
            </div>

            {/* Error */}

            {analyticsError && (
              <div
                className="empty-state"
                style={{
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: 0 }}>
                  {analyticsError}
                </h4>
              </div>
            )}

            {!analyticsError && (
              <>
                {/* KPI CARDS */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {[
                    {
                      icon: "📋",
                      title: "Total Complaints",
                      value:
                        analyticsLoading
                          ? "..."
                          : analytics.summary.total_complaints,
                      note: "All complaints currently tracked",
                    },
                    {
                      icon: "✅",
                      title: "Resolution Rate",
                      value:
                        analyticsLoading
                          ? "..."
                          : `${analytics.summary.resolution_rate}%`,
                      note: "Share of complaints resolved",
                    },
                    {
                      icon: "🏆",
                      title: "Top Issue",
                      value:
                        analyticsLoading
                          ? "..."
                          : (
                              analytics.summary
                                .most_common_issue ||
                              "None"
                            ),
                      note: "Most frequently reported category",
                    },
                    {
                      icon: "🏢",
                      title: "Highest Workload",
                      value:
                        analyticsLoading
                          ? "..."
                          : (
                              analytics.summary
                                .highest_workload_department ||
                              "None"
                            ),
                      note: "Department handling the most cases",
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "20px",
                        boxShadow:
                          "0 6px 18px rgba(15, 23, 42, 0.05)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f1f5f9",
                            fontSize: "20px",
                          }}
                        >
                          {card.icon}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "16px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#64748b",
                        }}
                      >
                        {card.title}
                      </div>

                      <div
                        style={{
                          marginTop: "6px",
                          fontSize:
                            card.title ===
                              "Total Complaints" ||
                            card.title ===
                              "Resolution Rate"
                              ? "32px"
                              : "18px",
                          fontWeight: 800,
                          color: "#0f172a",
                          lineHeight: 1.25,
                          minHeight:
                            card.title ===
                              "Total Complaints" ||
                            card.title ===
                              "Resolution Rate"
                              ? "40px"
                              : "46px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {card.value}
                      </div>

                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "13px",
                          color: "#94a3b8",
                        }}
                      >
                        {card.note}
                      </div>
                    </div>
                  ))}
                </div>

                {/* MAIN ANALYTICS GRID */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1.5fr) minmax(280px, 1fr)",
                    gap: "18px",
                    marginTop: "18px",
                  }}
                >
                  {/* CATEGORY BREAKDOWN */}

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "20px",
                      boxShadow:
                        "0 6px 18px rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "18px",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0 }}>
                          Issue Breakdown
                        </h3>
                        <p
                          className="section-subtitle"
                          style={{ marginTop: "4px" }}
                        >
                          Complaint volume by category
                        </p>
                      </div>

                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "#eff6ff",
                          color: "#2563eb",
                        }}
                      >
                        Live
                      </span>
                    </div>

                    {Object.entries(
                      analytics.by_category
                    ).length === 0 ? (
                      <p>
                        No category data available.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: "16px",
                        }}
                      >
                        {Object.entries(
                          analytics.by_category
                        ).map(
                          ([category, count]) => {
                            const total =
                              analytics.summary
                                .total_complaints || 1;

                            const percentage = Math.min(
                              100,
                              (Number(count) / total) * 100
                            );

                            return (
                              <div key={category}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent:
                                      "space-between",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginBottom: "7px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 600,
                                      color: "#334155",
                                    }}
                                  >
                                    {category}
                                  </span>

                                  <strong
                                    style={{
                                      fontSize: "14px",
                                      color: "#0f172a",
                                    }}
                                  >
                                    {count}
                                  </strong>
                                </div>

                                <div
                                  style={{
                                    height: "9px",
                                    borderRadius: "999px",
                                    background: "#e2e8f0",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${percentage}%`,
                                      borderRadius: "999px",
                                      background:
                                        "#2563eb",
                                      transition:
                                        "width 0.3s ease",
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>

                  {/* PRIORITY */}

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "20px",
                      boxShadow:
                        "0 6px 18px rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      Priority Overview
                    </h3>

                    <p
                      className="section-subtitle"
                      style={{ marginTop: "4px" }}
                    >
                      Urgency across current complaints
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gap: "12px",
                        marginTop: "18px",
                      }}
                    >
                      {Object.entries(
                        analytics.by_priority
                      ).map(
                        ([priority, count]) => (
                          <div
                            key={priority}
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems: "center",
                              padding: "14px 15px",
                              borderRadius: "12px",
                              background:
                                priority ===
                                "High"
                                  ? "#fef2f2"
                                  : "#f8fafc",
                              border:
                                "1px solid #e5e7eb",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color:
                                  priority ===
                                  "High"
                                    ? "#b91c1c"
                                    : "#475569",
                              }}
                            >
                              {priority}
                            </span>

                            <strong
                              style={{
                                fontSize: "18px",
                                color: "#0f172a",
                              }}
                            >
                              {count}
                            </strong>
                          </div>
                        )
                      )}

                      {Object.keys(
                        analytics.by_priority
                      ).length === 0 && (
                        <p>
                          No priority data available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* STATUS + DEPARTMENT */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "18px",
                    marginTop: "18px",
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "20px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      Status Overview
                    </h3>

                    <p
                      className="section-subtitle"
                      style={{ marginTop: "4px" }}
                    >
                      Current workflow distribution
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3, minmax(0, 1fr))",
                        gap: "10px",
                        marginTop: "18px",
                      }}
                    >
                      {Object.entries(
                        analytics.by_status
                      ).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            style={{
                              padding: "14px 10px",
                              borderRadius: "12px",
                              background: "#f8fafc",
                              border:
                                "1px solid #e2e8f0",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "22px",
                                fontWeight: 800,
                                color: "#0f172a",
                              }}
                            >
                              {count}
                            </div>

                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#64748b",
                              }}
                            >
                              {status}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "20px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      Department Workload
                    </h3>

                    <p
                      className="section-subtitle"
                      style={{ marginTop: "4px" }}
                    >
                      Cases assigned across departments
                    </p>

                    <div
                      style={{
                        marginTop: "18px",
                        display: "grid",
                        gap: "10px",
                      }}
                    >
                      {Object.entries(
                        analytics.by_department
                      ).map(
                        ([department, count]) => {
                          const total =
                            analytics.summary
                              .total_complaints || 1;

                          const percentage = Math.min(
                            100,
                            (Number(count) / total) *
                              100
                          );

                          return (
                            <div key={department}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  gap: "12px",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#334155",
                                }}
                              >
                                <span>
                                  {department}
                                </span>

                                <strong>
                                  {count}
                                </strong>
                              </div>

                              <div
                                style={{
                                  height: "7px",
                                  borderRadius: "999px",
                                  background:
                                    "#e2e8f0",
                                  overflow: "hidden",
                                  marginTop: "6px",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width:
                                      `${percentage}%`,
                                    borderRadius:
                                      "999px",
                                    background:
                                      "#0f766e",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}

                      {Object.keys(
                        analytics.by_department
                      ).length === 0 && (
                        <p>
                          No department data available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* RECENT AI ANALYTICS */}

                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "20px",
                    marginTop: "18px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>
                      Recent Complaints
                    </h3>

                    <p
                      className="section-subtitle"
                      style={{ marginTop: "4px" }}
                    >
                      Latest records considered by the Analytics Agent
                    </p>
                  </div>

                  {analytics.recent_complaints
                    .length === 0 ? (
                    <p style={{ marginTop: "16px" }}>
                      No recent complaints available.
                    </p>
                  ) : (
                    <div
                      style={{
                        overflowX: "auto",
                        marginTop: "16px",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          minWidth: "680px",
                        }}
                      >
                        <thead>
                          <tr>
                            {[
                              "Complaint",
                              "Category",
                              "Priority",
                              "Department",
                              "Status",
                              "Created",
                            ].map((header) => (
                              <th
                                key={header}
                                style={{
                                  textAlign: "left",
                                  padding:
                                    "10px 12px",
                                  fontSize: "12px",
                                  color: "#64748b",
                                  borderBottom:
                                    "1px solid #e2e8f0",
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {analytics.recent_complaints.map(
                            (complaint) => (
                              <tr
                                key={
                                  complaint.complaint_id
                                }
                              >
                                <td
                                  style={{
                                    padding:
                                      "12px",
                                    fontWeight: 700,
                                    fontSize: "13px",
                                    color: "#0f172a",
                                    borderBottom:
                                      "1px solid #f1f5f9",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {
                                    complaint.complaint_id
                                  }
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "12px",
                                    fontSize: "13px",
                                    borderBottom:
                                      "1px solid #f1f5f9",
                                  }}
                                >
                                  {
                                    complaint.category
                                  }
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "12px",
                                    fontSize: "13px",
                                    borderBottom:
                                      "1px solid #f1f5f9",
                                  }}
                                >
                                  {complaint.priority}
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "12px",
                                    fontSize: "13px",
                                    borderBottom:
                                      "1px solid #f1f5f9",
                                  }}
                                >
                                  {
                                    complaint.department
                                  }
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "12px",
                                    fontSize: "13px",
                                    borderBottom:
                                      "1px solid #f1f5f9",
                                  }}
                                >
                                  {complaint.status}
                                </td>

                                <td
                                  style={{
                                    padding:
                                      "12px",
                                    fontSize: "13px",
                                    color: "#64748b",
                                    borderBottom:
                                      "1px solid #f1f5f9",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {complaint.created_at
                                    ? new Date(
                                        complaint.created_at
                                      ).toLocaleString()
                                    : "—"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {/* =================================================
              MAP
             ================================================= */}

          <section className="recent-section">

            <div className="admin-header">

              <div>

                <div>

                  <h3>
                    Complaint Map
                  </h3>

                  <p className="section-subtitle">
                    Geographic view of complaints available to your account.
                  </p>

                </div>

              </div>

              <button
                className="report-button"
                onClick={
                  loadMapComplaints
                }
              >
                {
                  mapLoading
                    ? "Loading..."
                    : "Refresh Map"
                }
              </button>

            </div>

            {mapError && (
              <div className="empty-state">

                <h4>
                  {
                    mapError
                  }
                </h4>

              </div>
            )}

            {!mapLoading &&
              !mapError &&
              mapComplaints.length ===
                0 && (

                <div className="empty-state">

                  <div className="empty-icon">
                    🗺️
                  </div>

                  <h4>
                    No complaint locations available
                  </h4>

                  <p>
                    Complaints with saved latitude and longitude will appear here.
                  </p>

                </div>
              )}

            {!mapError &&
              mapComplaints.length >
                0 && (

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "minmax(0, 3fr) minmax(260px, 1fr)",
                    gap: "20px",
                    marginTop:
                      "20px",
                  }}
                >

                  {/* MAP CANVAS */}

                  <div
                    style={{
                      position:
                        "relative",
                      height:
                        "520px",
                      borderRadius:
                        "16px",
                      overflow:
                        "hidden",
                      border:
                        "1px solid #d1d5db",
                      background:
                        "linear-gradient(135deg, #e9f3ff 0%, #f5f7fa 50%, #e9eef5 100%)",
                    }}
                  >

                    <div
                      style={{
                        position:
                          "absolute",
                        inset: 0,
                        opacity:
                          0.35,
                        backgroundImage:
                          `
                            linear-gradient(#ffffff 1px, transparent 1px),
                            linear-gradient(90deg, #ffffff 1px, transparent 1px)
                          `,
                        backgroundSize:
                          "40px 40px",
                      }}
                    />

                    <div
                      style={{
                        position:
                          "absolute",
                        top:
                          "16px",
                        left:
                          "16px",
                        padding:
                          "10px 14px",
                        borderRadius:
                          "10px",
                        background:
                          "rgba(255,255,255,0.92)",
                        fontSize:
                          "13px",
                        zIndex:
                          5,
                      }}
                    >
                      📍{" "}
                      {
                        mapComplaints.length
                      } mapped complaint
                      {mapComplaints.length ===
                      1
                        ? ""
                        : "s"}
                    </div>

                    {mapComplaints.map(
                      (complaint) => {

                        const position =
                          getMarkerPosition(
                            complaint
                          );

                        const isSelected =
                          selectedMapComplaint?.complaint_id ===
                          complaint.complaint_id;

                        return (
                          <button
                            key={
                              complaint.complaint_id
                            }
                            type="button"
                            title={
                              complaint.complaint_id
                            }
                            onClick={() =>
                              setSelectedMapComplaint(
                                complaint
                              )
                            }
                            style={{
                              position:
                                "absolute",
                              left:
                                position.left,
                              top:
                                position.top,
                              transform:
                                "translate(-50%, -100%)",
                              width:
                                isSelected
                                  ? "32px"
                                  : "26px",
                              height:
                                isSelected
                                  ? "32px"
                                  : "26px",
                              borderRadius:
                                "50% 50% 50% 0",
                              transformOrigin:
                                "bottom left",
                              rotate:
                                "-45deg",
                              border:
                                isSelected
                                  ? "3px solid #111827"
                                  : "2px solid #ffffff",
                              background:
                                complaint.priority ===
                                "High"
                                  ? "#dc2626"
                                  : complaint.status ===
                                    "Resolved"
                                  ? "#16a34a"
                                  : "#f59e0b",
                              boxShadow:
                                "0 3px 8px rgba(0,0,0,0.25)",
                              cursor:
                                "pointer",
                              zIndex:
                                isSelected
                                  ? 10
                                  : 4,
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "block",
                                width:
                                  "7px",
                                height:
                                  "7px",
                                borderRadius:
                                  "50%",
                                background:
                                  "#ffffff",
                                position:
                                  "absolute",
                                left:
                                  "50%",
                                top:
                                  "50%",
                                transform:
                                  "translate(-50%, -50%) rotate(45deg)",
                              }}
                            />
                          </button>
                        );
                      }
                    )}

                  </div>

                  {/* MAP DETAILS */}

                  <div>

                    <div className="result-card">

                      <h3>
                        Selected Location
                      </h3>

                      {!selectedMapComplaint ? (

                        <p>
                          Click a marker on the map to inspect a complaint.
                        </p>

                      ) : (

                        <>

                          <div
                            className="result-row"
                          >
                            <span>
                              Complaint ID
                            </span>

                            <strong>
                              {
                                selectedMapComplaint.complaint_id
                              }
                            </strong>
                          </div>

                          <div
                            className="result-row"
                          >
                            <span>
                              Category
                            </span>

                            <strong>
                              {
                                selectedMapComplaint.category
                              }
                            </strong>
                          </div>

                          <div
                            className="result-row"
                          >
                            <span>
                              Priority
                            </span>

                            <strong>
                              {
                                selectedMapComplaint.priority
                              }
                            </strong>
                          </div>

                          <div
                            className="result-row"
                          >
                            <span>
                              Department
                            </span>

                            <strong>
                              {
                                selectedMapComplaint.department
                              }
                            </strong>
                          </div>

                          <div
                            className="result-row"
                          >
                            <span>
                              Status
                            </span>

                            <strong>
                              {
                                selectedMapComplaint.status
                              }
                            </strong>
                          </div>

                          <div
                            className="result-row"
                          >
                            <span>
                              Location
                            </span>

                            <strong>
                              {
                                selectedMapComplaint.location ||
                                "Coordinates only"
                              }
                            </strong>
                          </div>

                          <button
                            type="button"
                            className="report-button"
                            onClick={() => {
                              loadComplaintDetails(
                                selectedMapComplaint.complaint_id
                              );
                            }}
                            style={{
                              width:
                                "100%",
                              marginTop:
                                "12px",
                            }}
                          >
                            View Full Details
                          </button>

                        </>
                      )}

                    </div>

                    <div
                      className="result-card"
                      style={{
                        marginTop:
                          "15px",
                      }}
                    >

                      <h3>
                        Map Legend
                      </h3>

                      <p>
                        🔴 High priority
                      </p>

                      <p>
                        🟡 Other active complaint
                      </p>

                      <p>
                        🟢 Resolved complaint
                      </p>

                    </div>

                  </div>

                </div>
              )}

          </section>

          {/* =================================================
              DEPARTMENT OVERVIEW
             ================================================= */}

          <section className="recent-section">

            <div className="admin-header">

              <div>

                <h3>
                  Department Overview
                </h3>

                <p className="section-subtitle">
                  Complaint distribution by assigned department.
                </p>

              </div>

              <button
                className="report-button"
                onClick={
                  loadSummary
                }
              >
                Refresh
              </button>

            </div>

            {summaryError && (
              <div className="empty-state">

                <h4>
                  {
                    summaryError
                  }
                </h4>

              </div>
            )}

            {Object.keys(
              summary.department_counts ||
                {}
            ).length ===
              0 ? (

              <div className="empty-state">

                <h4>
                  No department data available.
                </h4>

              </div>

            ) : (

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "12px",
                  marginTop:
                    "20px",
                }}
              >

                {Object.entries(
                  summary.department_counts
                ).map(
                  ([department, count]) => {

                    const percentage =
                      summary.total_complaints >
                      0
                        ? Math.min(
                            100,
                            (
                              Number(
                                count
                              ) /
                              summary.total_complaints
                            ) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={
                          department
                        }
                        className="result-card"
                      >

                        <div className="result-row">

                          <span>
                            {
                              department
                            }
                          </span>

                          <strong>
                            {
                              count
                            }
                          </strong>

                        </div>

                        <div
                          style={{
                            height:
                              "8px",
                            borderRadius:
                              "10px",
                            background:
                              "#e5e7eb",
                            overflow:
                              "hidden",
                            marginTop:
                              "8px",
                          }}
                        >

                          <div
                            style={{
                              height:
                                "100%",
                              width:
                                `${percentage}%`,
                              background:
                                "#2563eb",
                              borderRadius:
                                "10px",
                            }}
                          />

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>

          {/* =================================================
              COMPLAINT MANAGEMENT
             ================================================= */}

          <section className="recent-section">

            <div className="admin-header">

              <div>

                <h3>
                  Complaint Management
                </h3>

                <p className="section-subtitle">
                  {
                    adminComplaints.length
                  } complaints available.
                </p>

              </div>

              <button
                className="report-button"
                onClick={
                  loadAdminComplaints
                }
              >
                {
                  adminLoading
                    ? "Loading..."
                    : "Refresh"
                }
              </button>

            </div>

            <div className="admin-filters">

              <div className="filter-group">

                <label>
                  Search
                </label>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Complaint ID, citizen, description..."
                />

              </div>

              <div className="filter-group">

                <label>
                  Category
                </label>

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                >

                  {categoryOptions.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="filter-group">

                <label>
                  Priority
                </label>

                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target.value
                    )
                  }
                >

                  {priorityOptions.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="filter-group">

                <label>
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >

                  <option value="All">
                    All
                  </option>

                  {statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="filter-action">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    clearAdminFilters
                  }
                >
                  Clear
                </button>

              </div>

            </div>

            {adminError && (
              <div className="empty-state">

                <h4>
                  {
                    adminError
                  }
                </h4>

              </div>
            )}

            {adminLoading && (
              <div className="empty-state">

                <h4>
                  Loading complaints...
                </h4>

              </div>
            )}

            {!adminLoading &&
              !adminError &&
              filteredAdminComplaints.length ===
                0 && (

                <div className="empty-state">

                  <div className="empty-icon">
                    🔎
                  </div>

                  <h4>
                    No matching complaints
                  </h4>

                </div>
              )}

            {!adminLoading &&
              !adminError &&
              filteredAdminComplaints.length >
                0 && (

                <div className="admin-table-wrapper">

                  <table className="admin-table">

                    <thead>

                      <tr>

                        <th>
                          Complaint
                        </th>

                        <th>
                          Category
                        </th>

                        <th>
                          Priority
                        </th>

                        <th>
                          Department
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredAdminComplaints.map(
                        (complaint) => (

                          <tr
                            key={
                              complaint.complaint_id
                            }
                          >

                            <td>

                              <strong>
                                {
                                  complaint.complaint_id
                                }
                              </strong>

                              <div>
                                {
                                  complaint.description
                                }
                              </div>

                            </td>

                            <td>
                              {
                                complaint.category
                              }
                            </td>

                            <td>
                              {
                                complaint.priority
                              }
                            </td>

                            <td>
                              {
                                complaint.department
                              }
                            </td>

                            <td>

                              <select
                                value={
                                  complaint.status
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateComplaintStatus(
                                    complaint.complaint_id,
                                    event.target.value
                                  )
                                }
                              >

                                {statusOptions.map(
                                  (status) => (
                                    <option
                                      key={
                                        status
                                      }
                                      value={
                                        status
                                      }
                                    >
                                      {status}
                                    </option>
                                  )
                                )}

                              </select>

                            </td>

                            <td>

                              <button
                                type="button"
                                className="report-button"
                                onClick={() =>
                                  loadComplaintDetails(
                                    complaint.complaint_id
                                  )
                                }
                              >
                                View Details
                              </button>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

          </section>

        </main>

      </div>
    );
  }

  // =======================================================
  // CITIZEN DASHBOARD
  // =======================================================

  return (
    <div className="dashboard">

      <header className="topbar">

        <div className="brand">

          <span className="brand-icon">
            🏙️
          </span>

          <span>
            Smart City AI
          </span>

        </div>

        <div className="profile">

          <span>
            {
              currentUser?.full_name
            }
          </span>

          <button onClick={logout}>
            Logout
          </button>

        </div>

      </header>

      <main className="dashboard-content">

        {!selectedIssue &&
        !submissionResult ? (

          <>

            <section className="welcome-section">

              <div>

                <h2>
                  Welcome,{" "}
                  {
                    currentUser?.full_name
                  }
                </h2>

                <p>
                  Report a civic issue and track its progress.
                </p>

              </div>

              <div className="status-card">

                <span className="status-number">
                  {
                    myComplaints.length
                  }
                </span>

                <span>
                  My Complaints
                </span>

              </div>

            </section>

            <section>

              <h3>
                Report a Civic Issue
              </h3>

              <p className="section-subtitle">
                Choose the issue you want to report.
              </p>

              <div className="issue-grid">

                {civicIssues.map(
                  (issue) => (

                    <div
                      className="issue-card"
                      key={
                        issue.title
                      }
                    >

                      <div className="issue-icon">
                        {
                          issue.icon
                        }
                      </div>

                      <h4>
                        {
                          issue.title
                        }
                      </h4>

                      <p>
                        {
                          issue.description
                        }
                      </p>

                      <button
                        className="report-button"
                        onClick={() =>
                          setSelectedIssue(
                            issue
                          )
                        }
                      >
                        Report Issue
                      </button>

                    </div>
                  )
                )}

              </div>

            </section>

            <section className="recent-section">

              <div className="admin-header">

                <div>

                  <h3>
                    My Complaints
                  </h3>

                  <p className="section-subtitle">
                    Your complaints and current status.
                  </p>

                </div>

                <button
                  className="report-button"
                  onClick={
                    loadMyComplaints
                  }
                >
                  {
                    complaintsLoading
                      ? "Refreshing..."
                      : "Refresh"
                  }
                </button>

              </div>

              {complaintsLoading ? (

                <div className="empty-state">

                  <h4>
                    Loading complaints...
                  </h4>

                </div>

              ) : complaintsError ? (

                <div className="empty-state">

                  <h4>
                    {
                      complaintsError
                    }
                  </h4>

                  <button
                    className="report-button"
                    onClick={
                      loadMyComplaints
                    }
                  >
                    Try Again
                  </button>

                </div>

              ) : myComplaints.length ===
                0 ? (

                <div className="empty-state">

                  <div className="empty-icon">
                    📋
                  </div>

                  <h4>
                    No complaints yet
                  </h4>

                </div>

              ) : (

                <div className="citizen-complaints">

                  {myComplaints.map(
                    (complaint) => (

                      <div
                        className="citizen-complaint-card"
                        key={
                          complaint.complaint_id
                        }
                      >

                        <div className="complaint-card-header">

                          <div>

                            <h4>
                              {
                                complaint.complaint_id
                              }
                            </h4>

                            <p>
                              {
                                complaint.category
                              }
                            </p>

                          </div>

                          <span className="complaint-status">
                            {
                              complaint.status
                            }
                          </span>

                        </div>

                        <p>
                          {
                            complaint.description
                          }
                        </p>

                        <div className="complaint-meta">

                          <span>
                            Priority:{" "}
                            <strong>
                              {
                                complaint.priority
                              }
                            </strong>
                          </span>

                          <span>
                            Department:{" "}
                            <strong>
                              {
                                complaint.department
                              }
                            </strong>
                          </span>

                        </div>

                        <div className="status-timeline">

                          <div
                            className={
                              complaint.status ===
                                "Submitted" ||
                              complaint.status ===
                                "In Progress" ||
                              complaint.status ===
                                "Resolved"
                                ? "timeline-step active"
                                : "timeline-step"
                            }
                          >

                            <span>
                              1
                            </span>

                            <p>
                              Submitted
                            </p>

                          </div>

                          <div
                            className={
                              complaint.status ===
                                "In Progress" ||
                              complaint.status ===
                                "Resolved"
                                ? "timeline-step active"
                                : "timeline-step"
                            }
                          >

                            <span>
                              2
                            </span>

                            <p>
                              In Progress
                            </p>

                          </div>

                          <div
                            className={
                              complaint.status ===
                                "Resolved"
                                ? "timeline-step active"
                                : "timeline-step"
                            }
                          >

                            <span>
                              3
                            </span>

                            <p>
                              Resolved
                            </p>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>

              )}

            </section>

          </>

        ) : selectedIssue &&
          !submissionResult ? (

          <section className="complaint-form-section">

            <button
              type="button"
              className="back-button"
              onClick={
                resetComplaintForm
              }
            >
              ← Back to My Complaints
            </button>

            <div className="complaint-header">

              <div className="selected-issue-icon">
                {
                  selectedIssue.icon
                }
              </div>

              <div>

                <h2>
                  {
                    selectedIssue.title
                  }
                </h2>

                <p>
                  Submit the details of your civic complaint.
                </p>

              </div>

            </div>

            <form
              className="complaint-form"
              onSubmit={
                submitComplaint
              }
            >

              <div className="form-group">

                <label>
                  Complaint Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Describe the problem..."
                  rows="5"
                />

              </div>

              <div className="form-group">

                <label>
                  Upload Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                />

                {image && (
                  <p className="file-name">
                    Selected:{" "}
                    {
                      image.name
                    }
                  </p>
                )}

              </div>

              <div className="location-box">

                <div>

                  <strong>
                    📍 Complaint Location
                  </strong>

                  <p>
                    {
                      formData.location ||
                      "Location not selected"
                    }
                  </p>

                </div>

                <button
                  type="button"
                  className="location-button"
                  onClick={
                    getLocation
                  }
                >
                  Use My Location
                </button>

              </div>

              <div className="form-group">

                <label>
                  Mobile Number
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={
                    formData.mobile
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter mobile number"
                />

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    resetComplaintForm
                  }
                  disabled={
                    isSubmitting
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={
                    isSubmitting
                  }
                >
                  {
                    isSubmitting
                      ? "Submitting..."
                      : "Submit Complaint"
                  }
                </button>

              </div>

            </form>

          </section>

        ) : (

          <section className="result-section">

            <div className="result-icon">
              ✅
            </div>

            <h2>
              Complaint Submitted
            </h2>

            <p className="result-intro">
              Your complaint has been registered and analyzed.
            </p>

            <div className="result-card">

              <div className="result-row">
                <span>
                  Complaint ID
                </span>

                <strong>
                  {
                    submissionResult.complaint_id
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Category
                </span>

                <strong>
                  {
                    submissionResult.category
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Priority
                </span>

                <strong>
                  {
                    submissionResult.priority
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Department
                </span>

                <strong>
                  {
                    submissionResult.department
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Status
                </span>

                <strong>
                  {
                    submissionResult.status
                  }
                </strong>
              </div>

              <div className="result-row">
                <span>
                  Email Notification
                </span>

                <strong>
                  {
                    submissionResult.email_sent
                      ? "Sent"
                      : "Not Sent"
                  }
                </strong>
              </div>

            </div>

            {submissionResult.ai_response && (
              <div className="ai-response-card">

                <h3>
                  Complaint Update
                </h3>

                <p>
                  {
                    submissionResult.ai_response
                  }
                </p>

              </div>
            )}

            <button
              className="submit-button"
              onClick={() => {
                resetComplaintForm();
                loadMyComplaints();
              }}
            >
              View My Complaints
            </button>

          </section>

        )}

      </main>

    </div>
  );
}

export default App;