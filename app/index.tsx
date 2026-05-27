import { useState, useEffect } from "react";
import { apiClient } from "../service/api";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ISSUE_TYPES = [
  { label: "Road Damage", icon: "🛣️" },
  { label: "Street Light", icon: "💡" },
  { label: "Garbage", icon: "🗑️" },
  { label: "Water Leak", icon: "💧" },
  { label: "Sewage", icon: "🚧" },
  { label: "Other", icon: "📌" },
];

type StatusKey = "Pending" | "In Progress" | "Resolved";

const STATUS_STYLES: Record<StatusKey, { bg: string; text: string; dot: string; border: string }> = {
  Pending: {
    bg: "#FFF3E0",
    text: "#E65100",
    dot: "#FF6D00",
    border: "#FFB74D",
  },
  "In Progress": {
    bg: "#E3F2FD",
    text: "#0D47A1",
    dot: "#1976D2",
    border: "#64B5F6",
  },
  Resolved: {
    bg: "#E8F5E9",
    text: "#1B5E20",
    dot: "#388E3C",
    border: "#81C784",
  },
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Calls GET http://10.0.2.2:5000/reports 
      const response = await apiClient("/reports");
      // Your backend returns { message: "...", data: [...] }
      if (response && response.data) {
        // Map backend names to match your frontend UI variables
        const mappedData = response.data.map((item: any) => ({
          id: item._id,
          type: item.title || "Report",
          desc: item.description || "No description provided",
          status: item.status || "Pending",
          loc: item.location || "Unknown location",
          time: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Just now"
        }));
        setComplaints(mappedData);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };
  const [selType, setSelType] = useState("");
  const [desc, setDesc] = useState("");
  const [loc, setLoc] = useState("");

  const stats = {
    pending: complaints.filter((c) => c.status === "Pending").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

  const submitComplaint = async () => {
    if (!selType || !desc || !loc) {
      Alert.alert(
        "Missing Info",
        "Please fill all fields and select an issue type.",
      );
      return;
    }

    try {
      setLoading(true);
      await apiClient("/report", {
        method: "POST",
        body: JSON.stringify({
          title: selType,
          description: desc,
          location: loc,
        }),
      });

      setSelType("");
      setDesc("");
      setLoc("");
      Alert.alert("✅ Submitted!", "Your complaint has been submitted successfully.");
      
      // Refresh list
      await fetchReports();
      setScreen("track");
    } catch (error) {
      console.error("Failed to submit:", error);
      Alert.alert("Error", "Could not submit the report.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (id: number, status: StatusKey) => {
    setComplaints(complaints.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  // ── HOME ──────────────────────────────────────────────
  if (screen === "home")
    return (
      <View style={s.root}>
        <StatusBar backgroundColor="#1565C0" barStyle="light-content" />
        <View style={s.heroHeader}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroTitle}>Smart Civic</Text>
              <Text style={s.heroTitle}>Reporter 🏙️</Text>
            </View>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>SC</Text>
            </View>
          </View>
          <Text style={s.heroSub}>
            🌆 Smart City · Civic Issue Management System
          </Text>
          <View style={s.statsRow}>
            <View
              style={[
                s.statCard,
                { backgroundColor: "rgba(255,255,255,0.15)" },
              ]}
            >
              <Text style={s.statNum}>{stats.pending}</Text>
              <Text style={s.statLbl}>Pending</Text>
            </View>
            <View
              style={[
                s.statCard,
                { backgroundColor: "rgba(255,255,255,0.15)" },
              ]}
            >
              <Text style={s.statNum}>{stats.inProgress}</Text>
              <Text style={s.statLbl}>In Progress</Text>
            </View>
            <View
              style={[
                s.statCard,
                { backgroundColor: "rgba(255,255,255,0.15)" },
              ]}
            >
              <Text style={s.statNum}>{stats.resolved}</Text>
              <Text style={s.statLbl}>Resolved</Text>
            </View>
          </View>
        </View>

        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.menuGrid}>
            {[
              {
                icon: "📸",
                label: "Report Issue",
                sub: "Submit complaint",
                color: "#E3F2FD",
                scr: "upload",
              },
              {
                icon: "📋",
                label: "My Complaints",
                sub: "Track status",
                color: "#E8F5E9",
                scr: "track",
              },
              {
                icon: "🌍",
                label: "Public Wall",
                sub: "Resolved issues",
                color: "#FFF8E1",
                scr: "public",
              },
              {
                icon: "🏛️",
                label: "Authority",
                sub: "Manage issues",
                color: "#F3E5F5",
                scr: "authority",
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.scr}
                style={[s.menuCard, { backgroundColor: item.color }]}
                onPress={() => setScreen(item.scr)}
              >
                <Text style={s.menuIcon}>{item.icon}</Text>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.sectionTitle}>Recent Activity</Text>
          {complaints.slice(0, 3).map((c) => {
            const ss = STATUS_STYLES[c.status as StatusKey];
            return (
              <View
                key={c.id}
                style={[s.recentCard, { borderLeftColor: ss.border }]}
              >
                <View style={s.recentTop}>
                  <Text style={s.recentType}>{c.type}</Text>
                  <View style={[s.badge, { backgroundColor: ss.bg }]}>
                    <View style={[s.dot, { backgroundColor: ss.dot }]} />
                    <Text style={[s.badgeText, { color: ss.text }]}>
                      {c.status}
                    </Text>
                  </View>
                </View>
                <Text style={s.recentDesc}>{c.desc}</Text>
                <View style={s.recentBottom}>
                  <Text style={s.recentLoc}>📍 {c.loc}</Text>
                  <Text style={s.recentTime}>{c.time}</Text>
                </View>
              </View>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    );

  // ── UPLOAD ────────────────────────────────────────────
  if (screen === "upload")
    return (
      <View style={s.root}>
        <View style={s.pageHeader}>
          <TouchableOpacity onPress={() => setScreen("home")} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>Report an Issue</Text>
        </View>
        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
          <View style={s.uploadHint}>
            <Text style={s.uploadHintText}>
              📌 Help us fix your area faster by providing accurate details
            </Text>
          </View>

          <Text style={s.fieldLabel}>Select Issue Type</Text>
          <View style={s.typeGrid}>
            {ISSUE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.label}
                style={[s.typeCard, selType === t.label && s.typeCardSel]}
                onPress={() => setSelType(t.label)}
              >
                <Text style={s.typeIcon}>{t.icon}</Text>
                <Text
                  style={[
                    s.typeLabel,
                    selType === t.label && { color: "#1565C0" },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Description</Text>
          <TextInput
            style={s.textArea}
            placeholder="Describe the issue clearly..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={4}
            value={desc}
            onChangeText={setDesc}
          />

          <Text style={s.fieldLabel}>Location</Text>
          <TextInput
            style={s.textInput}
            placeholder="Enter area or street name..."
            placeholderTextColor="#aaa"
            value={loc}
            onChangeText={setLoc}
          />

          <TouchableOpacity
            style={s.photoBtn}
            onPress={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.capture = "environment";
              input.onchange = (e: Event) => {
                const target = e.target as HTMLInputElement;
                const file = target?.files?.[0];
                if (file) Alert.alert("Photo Added!", file.name);
              };
              input.click();
            }}
          >
            <Text style={s.photoBtnText}>📷 Tap to add a photo</Text>
            <Text style={s.photoBtnSub}>JPG, PNG up to 10MB</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.submitBtn} onPress={submitComplaint}>
            <Text style={s.submitBtnText}>Submit Complaint</Text>
          </TouchableOpacity>
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    );

  // ── TRACK ─────────────────────────────────────────────
  if (screen === "track")
    return (
      <View style={s.root}>
        <View style={s.pageHeader}>
          <TouchableOpacity onPress={() => setScreen("home")} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>My Complaints</Text>
        </View>
        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
          <Text style={s.countText}>
            {complaints.length} complaints submitted
          </Text>
          {complaints.map((c) => {
            const ss = STATUS_STYLES[c.status as StatusKey];
            return (
              <View
                key={c.id}
                style={[s.recentCard, { borderLeftColor: ss.border }]}
              >
                <View style={s.recentTop}>
                  <Text style={s.recentType}>{c.type}</Text>
                  <View style={[s.badge, { backgroundColor: ss.bg }]}>
                    <View style={[s.dot, { backgroundColor: ss.dot }]} />
                    <Text style={[s.badgeText, { color: ss.text }]}>
                      {c.status}
                    </Text>
                  </View>
                </View>
                <Text style={s.recentDesc}>{c.desc}</Text>
                <View style={s.recentBottom}>
                  <Text style={s.recentLoc}>📍 {c.loc}</Text>
                  <Text style={s.recentTime}>{c.time}</Text>
                </View>
              </View>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    );

  // ── PUBLIC WALL ───────────────────────────────────────
  if (screen === "public")
    return (
      <View style={s.root}>
        <View style={s.pageHeader}>
          <TouchableOpacity onPress={() => setScreen("home")} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>Public Wall</Text>
        </View>
        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
          <View style={s.publicBanner}>
            <Text style={s.publicBannerText}>
              ✅ {complaints.filter((c) => c.status === "Resolved").length}{" "}
              issues resolved in your area
            </Text>
          </View>
          {complaints
            .filter((c) => c.status === "Resolved")
            .map((c) => (
              <View
                key={c.id}
                style={[s.recentCard, { borderLeftColor: "#81C784" }]}
              >
                <View style={s.recentTop}>
                  <Text style={s.recentType}>{c.type}</Text>
                  <View style={[s.badge, { backgroundColor: "#E8F5E9" }]}>
                    <View style={[s.dot, { backgroundColor: "#388E3C" }]} />
                    <Text style={[s.badgeText, { color: "#1B5E20" }]}>
                      Resolved
                    </Text>
                  </View>
                </View>
                <Text style={s.recentDesc}>{c.desc}</Text>
                <View style={s.recentBottom}>
                  <Text style={s.recentLoc}>📍 {c.loc}</Text>
                  <Text style={s.recentTime}>{c.time}</Text>
                </View>
              </View>
            ))}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    );

  // ── AUTHORITY ─────────────────────────────────────────
  if (screen === "authority")
    return (
      <View style={s.root}>
        <View style={s.pageHeader}>
          <TouchableOpacity onPress={() => setScreen("home")} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>Authority Dashboard</Text>
        </View>
        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
          <View style={s.authStatsRow}>
            <View style={[s.authStat, { backgroundColor: "#FFF3E0" }]}>
              <Text style={[s.authStatNum, { color: "#E65100" }]}>
                {stats.pending}
              </Text>
              <Text style={[s.authStatLbl, { color: "#E65100" }]}>Pending</Text>
            </View>
            <View style={[s.authStat, { backgroundColor: "#E3F2FD" }]}>
              <Text style={[s.authStatNum, { color: "#0D47A1" }]}>
                {stats.inProgress}
              </Text>
              <Text style={[s.authStatLbl, { color: "#0D47A1" }]}>
                In Progress
              </Text>
            </View>
            <View style={[s.authStat, { backgroundColor: "#E8F5E9" }]}>
              <Text style={[s.authStatNum, { color: "#1B5E20" }]}>
                {stats.resolved}
              </Text>
              <Text style={[s.authStatLbl, { color: "#1B5E20" }]}>
                Resolved
              </Text>
            </View>
          </View>
          {complaints.map((c) => {
            const ss = STATUS_STYLES[c.status as StatusKey];
            return (
              <View
                key={c.id}
                style={[s.recentCard, { borderLeftColor: ss.border }]}
              >
                <View style={s.recentTop}>
                  <Text style={s.recentType}>{c.type}</Text>
                  <View style={[s.badge, { backgroundColor: ss.bg }]}>
                    <View style={[s.dot, { backgroundColor: ss.dot }]} />
                    <Text style={[s.badgeText, { color: ss.text }]}>
                      {c.status}
                    </Text>
                  </View>
                </View>
                <Text style={s.recentDesc}>{c.desc}</Text>
                <View style={s.recentBottom}>
                  <Text style={s.recentLoc}>📍 {c.loc}</Text>
                  <Text style={s.recentTime}>{c.time}</Text>
                </View>
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: "#1565C0" }]}
                    onPress={() => updateStatus(c.id, "In Progress")}
                  >
                    <Text style={s.actionBtnText}>In Progress</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: "#2E7D32" }]}
                    onPress={() => updateStatus(c.id, "Resolved")}
                  >
                    <Text style={s.actionBtnText}>✓ Resolve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFF" },
  heroHeader: {
    backgroundColor: "#1565C0",
    padding: 20,
    paddingTop: 44,
    paddingBottom: 24,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 32,
  },
  heroSub: { fontSize: 12, color: "#90CAF9", marginBottom: 18 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  statLbl: { fontSize: 10, color: "#BBDEFB", marginTop: 2 },
  body: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#555",
    marginTop: 16,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 4,
  },
  menuCard: { width: "47%", borderRadius: 16, padding: 16 },
  menuIcon: { fontSize: 26, marginBottom: 8 },
  menuLabel: { fontSize: 14, fontWeight: "bold", color: "#1a1a2e" },
  menuSub: { fontSize: 11, color: "#666", marginTop: 2 },
  recentCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  recentType: { fontSize: 14, fontWeight: "bold", color: "#1a1a2e" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  recentDesc: { fontSize: 12, color: "#555", marginBottom: 6 },
  recentBottom: { flexDirection: "row", justifyContent: "space-between" },
  recentLoc: { fontSize: 11, color: "#888" },
  recentTime: { fontSize: 11, color: "#aaa" },
  pageHeader: {
    backgroundColor: "#1565C0",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 44,
    gap: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backText: { color: "#fff", fontSize: 18 },
  pageTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  uploadHint: {
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  uploadHintText: { fontSize: 12, color: "#1565C0" },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginTop: 14,
    marginBottom: 8,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  typeCard: {
    width: "30%",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  typeCardSel: { backgroundColor: "#E3F2FD", borderColor: "#1565C0" },
  typeIcon: { fontSize: 22, marginBottom: 4 },
  typeLabel: {
    fontSize: 11,
    color: "#555",
    textAlign: "center",
    fontWeight: "600",
  },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    textAlignVertical: "top",
    minHeight: 90,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  photoBtn: {
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#90CAF9",
    borderStyle: "dashed",
  },
  photoBtnText: { fontSize: 14, color: "#1565C0", fontWeight: "600" },
  photoBtnSub: { fontSize: 11, color: "#90CAF9", marginTop: 4 },
  submitBtn: {
    backgroundColor: "#1565C0",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  countText: { fontSize: 12, color: "#888", marginBottom: 12 },
  publicBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    alignItems: "center",
  },
  publicBannerText: { fontSize: 14, color: "#2E7D32", fontWeight: "600" },
  authStatsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  authStat: { flex: 1, borderRadius: 12, padding: 14, alignItems: "center" },
  authStatNum: { fontSize: 22, fontWeight: "bold" },
  authStatLbl: { fontSize: 11, marginTop: 2, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, borderRadius: 10, padding: 9, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
});
