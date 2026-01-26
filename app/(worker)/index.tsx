import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO } from "date-fns";
import { useFocusEffect, useRouter } from "expo-router";
import { CheckSquare, Filter, Square, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import WorkerScreenTemplate from "../../components/templates/WorkerScreenTemplate";
import WorkerJobCard from "../../components/WorkerJobCard";
import WorkerShiftCard from "../../components/WorkerShiftCard";
import { Colors } from "../../constants/colors";
import { Job, Shift, WorkerProfile } from "../../types";
import { useAuthStore } from "../store/authStore";
import { useAvailableShiftsStore } from "../store/availableShiftStore";
import { useJobStore } from "../store/jobStore";

import auth from "@react-native-firebase/auth";

console.log("Current user:", auth().currentUser);

// --- Type Guards and Helpers ---
type TimestampLike = { toDate: () => Date };

const toDateSafe = (date: Date | TimestampLike | string): Date => {
  if (!date) return new Date();
  if (typeof date === "string") return parseISO(date);
  if (date && typeof (date as TimestampLike).toDate === "function") {
    return (date as TimestampLike).toDate();
  }
  return date as Date;
};

const AVAILABILITY_STORAGE_KEY = "@workerAvailability";

const WorkerHome = () => {
  const { user, profile } = useAuthStore();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [tempSelectedRoles, setTempSelectedRoles] = useState<string[]>([]);
  const [appliedShifts, setAppliedShifts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("Shifts");
  const [availability, setAvailability] = useState<
    Record<
      string,
      { customStyles?: { container?: { backgroundColor?: string } } }
    >
  >({});

  const {
    jobs,
    hasNewJobs,
    isLoading: jobsLoading,
    subscribeToJobs,
    markJobsAsViewed,
    cleanup: cleanupJobs,
  } = useJobStore();
  const {
    shifts: availableShifts,
    isLoading: shiftsLoading,
    fetchAvailableShifts,
    cleanup: cleanupShifts,
  } = useAvailableShiftsStore();

  const workerName =
    profile && profile.userType === "worker"
      ? (profile as WorkerProfile).firstName
      : "";
  const userSkills =
    profile &&
    profile.userType === "worker" &&
    Array.isArray((profile as WorkerProfile).skills)
      ? (profile as WorkerProfile).skills
      : [];

  useEffect(() => {
    subscribeToJobs();
    if (user?.uid) {
      fetchAvailableShifts(user.uid);
    }
    return () => {
      cleanupJobs();
      cleanupShifts();
    };
  }, [
    user?.uid,
    subscribeToJobs,
    fetchAvailableShifts,
    cleanupJobs,
    cleanupShifts,
  ]);

  useEffect(() => {
    if (modalVisible) {
      setTempSelectedRoles(selectedRoles);
    }
  }, [modalVisible, selectedRoles]);

  const fetchAppliedShifts = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const shiftKeys = keys.filter((key) => key.startsWith("applied_shift_"));
      const storedShifts = await AsyncStorage.multiGet(shiftKeys);
      setAppliedShifts(
        storedShifts
          .map((s) => (s[1] ? JSON.parse(s[1]).id : ""))
          .filter((id) => id),
      );
    } catch (e) {
      console.error("Failed to fetch applied shifts", e);
    }
  };

  const fetchAvailability = async () => {
    try {
      const savedAvailability = await AsyncStorage.getItem(
        AVAILABILITY_STORAGE_KEY,
      );
      if (savedAvailability) setAvailability(JSON.parse(savedAvailability));
    } catch (error) {
      console.error("Failed to load availability", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAppliedShifts();
      fetchAvailability();
    }, []),
  );

  const filteredAndSortedShifts = useMemo(() => {
    return (availableShifts as Shift[])
      .filter((s) => {
        const startTime = toDateSafe(s.startTime);
        const dateString = format(startTime, "yyyy-MM-dd");
        if (
          availability[dateString]?.customStyles?.container?.backgroundColor ===
          Colors.danger
        )
          return false;
        if (selectedRoles.length > 0 && !selectedRoles.includes(s.role))
          return false;
        return true;
      })
      .sort((a, b) => {
        if (
          a.status === "offered_to_worker" &&
          b.status !== "offered_to_worker"
        )
          return -1;
        if (
          b.status === "offered_to_worker" &&
          a.status !== "offered_to_worker"
        )
          return 1;
        return (
          toDateSafe(a.startTime).getTime() - toDateSafe(b.startTime).getTime()
        );
      });
  }, [availableShifts, availability, selectedRoles]);

  const filteredJobs = useMemo(() => {
    if (selectedRoles.length === 0) return jobs as Job[];
    return (jobs as Job[]).filter((job) =>
      job.roleCategories.some((role) => selectedRoles.includes(role)),
    );
  }, [jobs, selectedRoles]);

  const handleShiftPress = (shift: Shift) => {
    const route =
      shift.status === "offered_to_worker"
        ? "/(worker)/WorkerViewShiftOfferCard"
        : "/(worker)/WorkerViewShiftDetailsCard";
    router.push({ pathname: route, params: { shift: JSON.stringify(shift) } });
  };

  const handleJobPress = (job: Job) => {
    router.push({
      pathname: "/(worker)/WorkerViewJobDetailsCard",
      params: { job: JSON.stringify(job) },
    });
  };

  const handleApply = async (shift: Shift) => {
    try {
      await AsyncStorage.setItem(
        `applied_shift_${shift.id}`,
        JSON.stringify(shift),
      );
      fetchAppliedShifts();
    } catch (e) {
      Alert.alert("Error", "Failed to apply for the shift.");
    }
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    if (tab === "Jobs") markJobsAsViewed();
  };

  const applyFilters = () => {
    setSelectedRoles(tempSelectedRoles);
    setModalVisible(false);
  };

  const clearFilters = () => {
    setTempSelectedRoles([]);
  };

  const toggleRoleSelection = (role: string) => {
    setTempSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const renderContent = () => {
    const isLoading = activeTab === "Shifts" ? shiftsLoading : jobsLoading;
    if (isLoading)
      return (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={Colors.primary}
        />
      );

    if (activeTab === "Shifts") {
      return filteredAndSortedShifts.length > 0 ? (
        filteredAndSortedShifts.map((shift) => (
          <WorkerShiftCard
            key={shift.id}
            item={shift}
            onPress={() => handleShiftPress(shift)}
            onSwipeApply={() => handleApply(shift)}
            isApplied={appliedShifts.includes(shift.id)}
            isNew={!appliedShifts.includes(shift.id)}
            isOffered={shift.status === "offered_to_worker"}
          />
        ))
      ) : (
        <Text style={styles.noDataText}>No available shifts found.</Text>
      );
    } else {
      return filteredJobs.length > 0 ? (
        filteredJobs.map((job) => (
          <WorkerJobCard
            key={job.id}
            item={job}
            onPress={() => handleJobPress(job)}
          />
        ))
      ) : (
        <Text style={styles.noDataText}>No jobs posted right now.</Text>
      );
    }
  };

  return (
    <WorkerScreenTemplate>
      <View style={styles.flexView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome Salman</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Filter size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {["Shifts", "Jobs"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => handleTabPress(tab)}
            >
              <View style={styles.tabItemContainer}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
                {tab === "Jobs" && hasNewJobs && (
                  <View style={styles.newJobDot} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.container}>{renderContent()}</ScrollView>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Filter by Your Skills</Text>
            <FlatList
              data={userSkills}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => toggleRoleSelection(item)}
                >
                  {tempSelectedRoles.includes(item) ? (
                    <CheckSquare size={24} color={Colors.primary} />
                  ) : (
                    <Square size={24} color={Colors.textSecondary} />
                  )}
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noDataText}>
                  You have no skills on your profile.
                </Text>
              }
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </WorkerScreenTemplate>
  );
};

const styles = StyleSheet.create({
  flexView: { flex: 1 },
  loader: { marginTop: 50 },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: Colors.text },
  tabContainer: { flexDirection: "row", backgroundColor: Colors.white },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 16, fontWeight: "bold", color: Colors.textSecondary },
  activeTabText: { color: Colors.primary },
  tabItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  newJobDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    position: "absolute",
    right: -12,
    top: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: Colors.text },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 10,
    marginBottom: 15,
  },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  optionText: { fontSize: 16, marginLeft: 15, color: Colors.text, flex: 1 },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 15,
    marginTop: 15,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textSecondary,
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  applyButtonText: { fontSize: 16, fontWeight: "bold", color: Colors.white },
});

export default WorkerHome;
