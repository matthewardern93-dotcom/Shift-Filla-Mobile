import { Feather, FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Controller } from "react-hook-form";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { CustomPicker as Picker } from "../../components/Picker";
import WorkerScreenTemplate from "../../components/templates/WorkerScreenTemplate";
import WorkerReviewsModal from "../../components/WorkerReviewsModal";
import { Colors } from "../../constants/colors";
import { useWorkerProfileController } from "../../hooks/controllers";

interface DocumentRowProps {
  docName: string | null;
  docType: string;
  onUpdate: () => void;
  onView: () => void;
}

const DocumentRow = ({
  docName,
  docType,
  onUpdate,
  onView,
}: DocumentRowProps) => (
  <View style={styles.documentRow}>
    <View>
      <Text style={styles.documentTypeLabel}>{docType}</Text>
      <Text style={styles.documentName}>{docName || "Not Uploaded"}</Text>
    </View>
    <View style={styles.documentActions}>
      {docName && (
        <TouchableOpacity onPress={onView} style={styles.docActionButton}>
          <Feather name="eye" size={20} color={Colors.primary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onUpdate} style={styles.docActionButton}>
        <Feather name="upload" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  </View>
);

const WorkerProfileScreen = () => {
  const {
    profile,
    isLoading,
    error,
    control,
    errors,
    handleSubmit,
    isSaving,
    isReviewsModalVisible,
    setReviewsModalVisible,
    profilePictureUri,
    selectedSkills,
    selectedCity,
    setSelectedCity,
    documents,
    pickImage,
    handleDocumentUpload,
    viewDocument,
    toggleSkill,
    onSubmit,
    getDocName,
    documentTypes,
    skillsList,
    locationsList,
  } = useWorkerProfileController();

  if (isLoading) {
    return (
      <WorkerScreenTemplate>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </WorkerScreenTemplate>
    );
  }

  if (error || !profile) {
    return (
      <WorkerScreenTemplate>
        <View style={styles.centered}>
          <Text>{error || "Could not load profile."}</Text>
        </View>
      </WorkerScreenTemplate>
    );
  }

  return (
    <WorkerScreenTemplate>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Image
            source={{ uri: profilePictureUri || undefined }}
            style={styles.avatar}
          />
          <View style={styles.avatarEditHint}>
            <Feather name="edit-2" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => setReviewsModalVisible(true)}
          >
            <FontAwesome name="star" size={24} color={Colors.gold} />
            <Text style={styles.statValue}>
              {profile.avgRating?.toFixed(1) || "N/A"}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </TouchableOpacity>
          <View style={styles.statBox}>
            <Feather name="check-square" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{profile.completedShifts || 0}</Text>
            <Text style={styles.statLabel}>Shifts Done</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={`${profile.firstName} ${profile.lastName}`}
            editable={false}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={profile.email}
            editable={false}
          />

          <Text style={styles.label}>Contact Number</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
              />
            )}
          />
          {errors.phone && (
            <Text style={styles.errorText}>
              {errors.phone.message as string}
            </Text>
          )}

          <Text style={styles.label}>About Me</Text>
          <Controller
            control={control}
            name="about"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
              />
            )}
          />

          <Text style={styles.label}>My Skills</Text>
          <View style={styles.skillsContainer}>
            {skillsList.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                style={[
                  styles.skillChip,
                  selectedSkills.includes(skill.id)
                    ? styles.skillChipSelected
                    : {},
                ]}
                onPress={() => toggleSkill(skill.id)}
              >
                <Text
                  style={[
                    styles.skillChipText,
                    selectedSkills.includes(skill.id)
                      ? styles.skillChipTextSelected
                      : {},
                  ]}
                >
                  {skill.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>City</Text>
          <View style={styles.pickerContainer}>
            <Picker
              options={locationsList}
              selectedValue={selectedCity || null}
              onValueChange={(itemValue) =>
                setSelectedCity(itemValue as string)
              }
            />
          </View>

          <Text style={styles.label}>Documents</Text>
          <View style={styles.documentsSection}>
            {documentTypes.map((doc) => (
              <DocumentRow
                key={doc.key}
                docType={doc.label}
                docName={getDocName(documents[doc.key])}
                onUpdate={() => handleDocumentUpload(doc.label)}
                onView={() => viewDocument(documents[doc.key])}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            style={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <WorkerReviewsModal
        isVisible={isReviewsModalVisible}
        onClose={() => setReviewsModalVisible(false)}
        reviews={[]}
      />
    </WorkerScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
    marginTop: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightGray,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarEditHint: {
    position: "absolute",
    bottom: 5,
    right: "35%",
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statBox: {
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    backgroundColor: Colors.white,
    width: "48%",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  form: { paddingBottom: 40 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  readOnlyInput: {
    backgroundColor: Colors.lightGray,
    color: Colors.textSecondary,
  },
  textArea: { height: 120, textAlignVertical: "top" },
  errorText: { color: Colors.danger, marginTop: 4 },
  skillsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
  skillChip: {
    backgroundColor: Colors.lightGray,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 4,
  },
  skillChipSelected: { backgroundColor: Colors.primary },
  skillChipText: { color: Colors.text, fontSize: 14 },
  skillChipTextSelected: { color: Colors.white },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 30,
  },
  saveButtonText: { color: Colors.white, fontSize: 18, fontWeight: "bold" },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    justifyContent: "center",
  },
  documentsSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  documentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  documentTypeLabel: { fontSize: 16, color: Colors.text, fontWeight: "500" },
  documentName: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  documentActions: { flexDirection: "row", alignItems: "center" },
  docActionButton: { marginLeft: 15, padding: 5 },
});

export default WorkerProfileScreen;
