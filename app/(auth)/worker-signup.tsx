import {
    ArrowLeft,
    CheckSquare,
    ChevronDown,
    Square,
    Upload,
    UploadCloud,
    User,
} from "lucide-react-native";
import { useState } from "react";
import { Controller } from "react-hook-form";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import CustomDateTimePicker from "../../components/DateTimePicker";
import Input from "../../components/input";
import { Colors } from "../../constants/colors";
import { useWorkerSignupController } from "../../hooks/controllers";

type PickerItemLocal = { label: string; value: string };

const CustomPicker = ({
  label,
  items,
  selectedValue,
  onValueChange,
  prompt,
  error,
}: {
  label: string;
  items: PickerItemLocal[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  prompt: string;
  error?: string;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedLabel =
    items.find((item) => item.value === selectedValue)?.label || prompt;

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[styles.pickerText, !selectedValue && styles.placeholderText]}
        >
          {selectedLabel}
        </Text>
        <ChevronDown size={20} color={Colors.gray} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const MultiSelectPicker: React.FC<{
  label: string;
  items: { label: string; value: string }[];
  selectedItems: string[];
  onSelectionChange: (selection: string[]) => void;
  error?: string;
}> = ({ label, items, selectedItems, onSelectionChange, error }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const toggleItem = (itemValue: string) => {
    const newSelection = selectedItems.includes(itemValue)
      ? selectedItems.filter((v) => v !== itemValue)
      : [...selectedItems, itemValue];
    onSelectionChange(newSelection);
  };

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.pickerText} numberOfLines={1}>
          {selectedItems.length > 0
            ? `${selectedItems.length} selected`
            : `Select ${label.toLowerCase()}...*`}
        </Text>
        <ChevronDown size={20} color={Colors.gray} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.multiSelectItem}
                  onPress={() => toggleItem(item.value)}
                >
                  {selectedItems.includes(item.value) ? (
                    <CheckSquare size={24} color={Colors.primary} />
                  ) : (
                    <Square size={24} color={Colors.primary} />
                  )}
                  <Text style={styles.multiSelectItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function WorkerSignUpScreen() {
  const {
    control,
    errors,
    isValid,
    handleSubmit,
    setValue,
    isLoading,
    profilePicPreview,
    idDocName,
    visaDocName,
    resumeName,
    nationality,
    agreeToTerms,
    pickFile,
    onSubmit,
    handleBack,
    locationsList,
    skillsList,
    countries,
    languages,
  } = useWorkerSignupController();

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity 
        onPress={handleBack} 
        style={styles.backButton}
        disabled={isLoading}
      >
        <ArrowLeft size={24} color={isLoading ? Colors.gray : Colors.primary} />
        <Text style={[styles.backButtonText, isLoading && { color: Colors.gray }]}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create Contractor Account</Text>
      <Text style={styles.description}>
        Please provide your details to get started.
      </Text>

      <Controller
        name="profilePictureUri"
        control={control}
        render={() => (
          <View style={styles.logoSection}>
            <TouchableOpacity
              onPress={() => pickFile("profilePictureUri", "image")}
            >
              <View style={styles.avatar}>
                {profilePicPreview ? (
                  <Image
                    source={{ uri: profilePicPreview }}
                    style={styles.logoPreview}
                  />
                ) : (
                  <User size={40} color={Colors.gray} />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pickFile("profilePictureUri", "image")}
              style={styles.uploadButton}
            >
              <Upload size={18} color={Colors.white} />
              <Text style={styles.uploadButtonText}>Upload Picture*</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      {errors.profilePictureUri && (
        <Text style={styles.errorText}>{errors.profilePictureUri.message}</Text>
      )}

      <Text style={styles.sectionHeader}>Account Details</Text>
      <Controller
        name="firstName"
        control={control}
        render={({ field }) => (
          <Input
            style={styles.input}
            placeholder="First Name*"
            placeholderTextColor={Colors.textSecondary}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      {errors.firstName && (
        <Text style={styles.errorText}>{errors.firstName.message}</Text>
      )}

      <Controller
        name="lastName"
        control={control}
        render={({ field }) => (
          <Input
            style={styles.input}
            placeholder="Last Name*"
            placeholderTextColor={Colors.textSecondary}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      {errors.lastName && (
        <Text style={styles.errorText}>{errors.lastName.message}</Text>
      )}

      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <Input
            style={styles.input}
            placeholder="Mobile Number*"
            placeholderTextColor={Colors.textSecondary}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
            keyboardType="phone-pad"
          />
        )}
      />
      {errors.phone && (
        <Text style={styles.errorText}>{errors.phone.message}</Text>
      )}

      <Controller
        name="dateOfBirth"
        control={control}
        render={({ field }) => (
          <CustomDateTimePicker
            mode="date"
            placeholder="Date of Birth*"
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {errors.dateOfBirth && (
        <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
      )}

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Input
            style={styles.input}
            placeholder="Email*"
            placeholderTextColor={Colors.textSecondary}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      {errors.email && (
        <Text style={styles.errorText}>{errors.email.message}</Text>
      )}

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Input
            style={styles.input}
            placeholder="Password (min. 8 characters)*"
            placeholderTextColor={Colors.textSecondary}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
            secureTextEntry
          />
        )}
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password.message}</Text>
      )}

      <Text style={styles.sectionHeader}>Your Profile</Text>
      <Controller
        name="location"
        control={control}
        render={({ field }) => (
          <CustomPicker
            label="City*"
            items={locationsList}
            selectedValue={field.value}
            onValueChange={field.onChange}
            prompt="Select your city"
            error={errors.location?.message}
          />
        )}
      />

      <Controller
        name="skills"
        control={control}
        render={({ field }) => (
          <MultiSelectPicker
            label="Skills*"
            items={skillsList.map((skill) => ({
              label: skill.label,
              value: skill.id,
            }))}
            selectedItems={field.value || []}
            onSelectionChange={(value: string[]) => field.onChange(value)}
            error={errors.skills?.message}
          />
        )}
      />

      <Controller
        name="languages"
        control={control}
        render={({ field }) => (
          <MultiSelectPicker
            label="Languages Spoken*"
            items={languages}
            selectedItems={field.value || []}
            onSelectionChange={(value: string[]) => field.onChange(value)}
            error={errors.languages?.message}
          />
        )}
      />

      <Controller
        name="about"
        control={control}
        render={({ field }) => (
          <Input
            style={[styles.input, styles.textArea]}
            placeholder="Tell venues a little bit about yourself...*"
            placeholderTextColor={Colors.textSecondary}
            multiline
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      {errors.about && (
        <Text style={styles.errorText}>{errors.about.message}</Text>
      )}

      <Controller
        name="resumeUri"
        control={control}
        render={() => (
          <TouchableOpacity
            style={styles.fileUpload}
            onPress={() => pickFile("resumeUri", "doc")}
          >
            <UploadCloud size={24} color={Colors.gray} />
            <Text style={styles.fileUploadText}>
              {resumeName || "Upload Resume*"}
            </Text>
          </TouchableOpacity>
        )}
      />
      {errors.resumeUri && (
        <Text style={styles.errorText}>{errors.resumeUri.message}</Text>
      )}

      <Text style={styles.sectionHeader}>Verification</Text>
      <Controller
        name="nationality"
        control={control}
        render={({ field }) => (
          <CustomPicker
            label="Nationality*"
            items={countries.map((c) => ({ label: c.name, value: c.code }))}
            selectedValue={field.value}
            onValueChange={field.onChange}
            prompt="Select your nationality"
            error={errors.nationality?.message}
          />
        )}
      />

      <Controller
        name="idDocumentUri"
        control={control}
        render={() => (
          <TouchableOpacity
            style={styles.fileUpload}
            onPress={() => pickFile("idDocumentUri", "doc")}
          >
            <UploadCloud size={24} color={Colors.primary} />
            <Text style={[styles.fileUploadText, { color: Colors.primary }]}>
              {idDocName || "Upload ID Document*"}
            </Text>
          </TouchableOpacity>
        )}
      />
      {errors.idDocumentUri && (
        <Text style={styles.errorText}>{errors.idDocumentUri.message}</Text>
      )}

      {nationality && nationality !== "NZ" && nationality !== "AU" && (
        <>
          <Controller
            name="visaDocumentUri"
            control={control}
            render={() => (
              <TouchableOpacity
                style={styles.fileUpload}
                onPress={() => pickFile("visaDocumentUri", "doc")}
              >
                <UploadCloud size={24} color={Colors.primary} />
                <Text
                  style={[styles.fileUploadText, { color: Colors.primary }]}
                >
                  {visaDocName || "Upload Right-to-Work Visa*"}
                </Text>
              </TouchableOpacity>
            )}
          />
          {errors.visaDocumentUri && (
            <Text style={styles.errorText}>
              {errors.visaDocumentUri.message}
            </Text>
          )}

          <Controller
            name="visaType"
            control={control}
            render={({ field }) => (
              <Input
                style={styles.input}
                placeholder="Visa Type (e.g., Work Visa)*"
                placeholderTextColor={Colors.textSecondary}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          {errors.visaType && (
            <Text style={styles.errorText}>{errors.visaType.message}</Text>
          )}

          <Controller
            name="visaExpiry"
            control={control}
            render={({ field }) => (
              <CustomDateTimePicker
                mode="date"
                placeholder="Visa Expiry Date*"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.visaExpiry && (
            <Text style={styles.errorText}>{errors.visaExpiry.message}</Text>
          )}
        </>
      )}

      <Text style={styles.sectionHeader}>Payment</Text>
      <Controller
        name="irdNumber"
        control={control}
        render={({ field }) => (
          <Input
            style={styles.input}
            placeholder="IRD Number*"
            placeholderTextColor={Colors.textSecondary}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      {errors.irdNumber && (
        <Text style={styles.errorText}>{errors.irdNumber.message}</Text>
      )}

      <Text style={styles.sectionHeader}>Agreements</Text>
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          onPress={() =>
            setValue("agreeToTerms", !agreeToTerms, { shouldValidate: true })
          }
          style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}
        >
          {agreeToTerms && <CheckSquare size={18} color={Colors.white} />}
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>
          I agree to the Terms of Service & Stripe Agreement.*
        </Text>
      </View>
      {errors.agreeToTerms && (
        <Text style={styles.errorText}>{errors.agreeToTerms.message}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!isValid || isLoading) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Submit Application</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: Colors.secondary },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.primary,
  },
  description: { fontSize: 16, color: Colors.gray, marginBottom: 24 },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 8,
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: Colors.text,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: { fontSize: 16, color: Colors.text, flex: 1 },
  placeholderText: { color: Colors.textSecondary },
  textArea: { height: 100, textAlignVertical: "top" },
  logoSection: { alignItems: "center", marginBottom: 12 },
  avatar: {
    height: 100,
    width: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  logoPreview: { height: 100, width: 100 },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  uploadButtonText: { color: Colors.white, marginLeft: 8, fontWeight: "500" },
  fileUpload: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  fileUploadText: { marginLeft: 10, color: Colors.gray, flex: 1 },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: Colors.primary,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: { marginLeft: 12, fontSize: 16, color: Colors.gray, flex: 1 },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: { backgroundColor: Colors.gray },
  submitButtonText: { color: Colors.white, fontSize: 18, fontWeight: "bold" },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 10,
    marginTop: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalItemText: { fontSize: 18, textAlign: "center", color: Colors.primary },
  multiSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  multiSelectItemText: { fontSize: 18, marginLeft: 15, color: Colors.text },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  confirmButtonText: { color: Colors.white, fontSize: 16, fontWeight: "bold" },
  inputWrapper: { marginBottom: 16 },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: Colors.text,
  },
});
