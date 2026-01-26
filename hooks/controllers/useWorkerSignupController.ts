import { zodResolver } from "@hookform/resolvers/zod";
import { startOfDay } from "date-fns";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "react-native";
import { z } from "zod";
import { useAuthStore } from "../../app/store/authStore";
import { locationsList } from "../../constants/Cities";
import { countries } from "../../constants/Countries";
import { languages as languageData } from "../../constants/Languages";
import { skillsList } from "../../constants/Skills";
import { signUpWorker } from "../../services/users";

// Form Schema
export const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: z.string().email("Invalid email address."),
    phone: z.string().min(1, "Mobile number is required."),
    location: z.string().min(1, "City is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    skills: z
      .array(z.string())
      .min(1, "You have to select at least one skill."),
    languages: z
      .array(z.string())
      .min(1, "You have to select at least one language."),
    about: z
      .string()
      .min(
        20,
        "Please write a brief description about yourself (at least 20 characters).",
      ),
    resumeUri: z.string().min(1, "Resume is required."),
    nationality: z.string().min(1, "Please select your nationality."),
    dateOfBirth: z.date({ message: "Date of birth is required." }),
    idDocumentUri: z.string().min(1, "ID document is required."),
    visaDocumentUri: z.string().optional(),
    visaType: z.string().optional(),
    visaExpiry: z.date().optional(),
    irdNumber: z.string().min(1, "IRD number is required."),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, "You must agree to the terms."),
    profilePictureUri: z.string().min(1, "Profile picture is required."),
  })
  .refine(
    (data) => {
      if (
        data.nationality &&
        data.nationality !== "NZ" &&
        data.nationality !== "AU"
      ) {
        return !!data.visaDocumentUri && !!data.visaType && !!data.visaExpiry;
      }
      return true;
    },
    {
      message:
        "Valid visa documentation, type, and expiry date are required for your selected nationality.",
      path: ["visaDocumentUri"],
    },
  )
  .refine(
    (data) => {
      if (data.visaExpiry) {
        return data.visaExpiry >= startOfDay(new Date());
      }
      return true;
    },
    {
      message: "Visa expiry date cannot be in the past.",
      path: ["visaExpiry"],
    },
  );

export type FormData = z.infer<typeof formSchema>;
export type PickerItem = { label: string; value: string };

export const useWorkerSignupController = () => {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    null,
  );
  const [idDocName, setIdDocName] = useState<string | null>(null);
  const [visaDocName, setVisaDocName] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
  });

  const nationality = watch("nationality");
  const agreeToTerms = watch("agreeToTerms");

  const pickFile = async (field: keyof FormData, type: "image" | "doc") => {
    const pickerResult =
      type === "image"
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          })
        : await DocumentPicker.getDocumentAsync({});

    if (pickerResult.canceled === false) {
      const asset = pickerResult.assets?.[0];
      if (asset && "uri" in asset) {
        const uri = asset.uri;
        const fileName = "name" in asset ? asset.name : uri.split("/").pop();
        setValue(field, uri, { shouldValidate: true });

        if (field === "profilePictureUri") setProfilePicPreview(uri);
        else if (field === "idDocumentUri")
          setIdDocName(fileName || "ID Document");
        else if (field === "visaDocumentUri")
          setVisaDocName(fileName || "Visa Document");
        else if (field === "resumeUri") setResumeName(fileName || "Resume");
      }
    }
  };

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);

    // Navigate to pending page immediately with uploading state
    // User will see loading state while signup/uploads complete in background
    router.replace("/(auth)/pending?uploading=true");

    try {
      const {
        resumeUri,
        idDocumentUri,
        profilePictureUri,
        visaDocumentUri,
        agreeToTerms,
        ...rest
      } = values;
      const signUpData = {
        ...rest,
        resumeUrl: resumeUri,
        idDocumentUrl: idDocumentUri,
        profilePictureUrl: profilePictureUri,
        visaDocumentUrl: visaDocumentUri,
      };

      // Complete signup in background (user already on pending page)
      // This includes file uploads and profile creation
      await signUpWorker(signUpData);

      // Sign out the user after signup completes (they're automatically logged in by Firebase)
      await signOut();
      router.replace("/(auth)/pending?fromSignup=true");
    } catch (error: any) {
      console.error("Signup Error:", error);
      let errorMessage = "An unknown error occurred during signup.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage =
          "Password is too weak. Please use at least 8 characters.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      // On error, navigate back to signup page
      router.replace("/(auth)/worker-signup");
      Alert.alert("Signup Failed", errorMessage);
      setIsLoading(false); // Re-enable button on error so user can retry
    }
    // Note: We don't set isLoading to false on success since we're navigating away
  };

  const handleBack = () => {
    if (isLoading) {
      return;
    }
    router.back();
  };

  return {
    // Form control
    control,
    errors,
    isValid,
    handleSubmit,
    setValue,
    watch,

    // UI state
    isLoading,
    profilePicPreview,
    idDocName,
    visaDocName,
    resumeName,
    nationality,
    agreeToTerms,

    // Handlers
    pickFile,
    onSubmit,
    handleBack,

    // Constants
    locationsList,
    skillsList,
    countries,
    languages: languageData,
  };
};
