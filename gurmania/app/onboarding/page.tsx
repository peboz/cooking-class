"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChefHat, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { SKILL_LEVELS, DIETARY_PREFERENCES, ALLERGENS, CUISINE_TYPES } from "@/lib/constants";

const steps = [
  {
    title: "Razina vještine",
    description: "Koliko iskustva imate u kuhanju?",
    icon: ChefHat,
  },
  {
    title: "Prehrambene preferencije",
    description: "Koje prehrambene preferencije želite pratiti?",
    icon: Sparkles,
  },
  {
    title: "Alergeni",
    description: "Imate li bilo kakve alergije na hranu?",
    icon: Sparkles,
  },
  {
    title: "Omiljene kuhinje",
    description: "Koje kuhinje Vas najviše zanimaju?",
    icon: Sparkles,
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [skillLevel, setSkillLevel] = useState<string>("");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>([]);

  const handleNext = () => {
    if (currentStep === 0 && !skillLevel) {
      setError("Molimo odaberite razinu vještine");
      return;
    }
    setError("");
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError("");
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleSelection = (value: string, currentArray: string[], setter: (arr: string[]) => void) => {
    if (currentArray.includes(value)) {
      setter(currentArray.filter((item) => item !== value));
    } else {
      setter([...currentArray, value]);
    }
  };

  const handleSubmit = async (useDefaults = false) => {
    const finalSkillLevel = useDefaults ? "BEGINNER" : skillLevel;
    
    if (!finalSkillLevel) {
      setError("Molimo odaberite razinu vještine");
      setCurrentStep(0);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/profile/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillLevel: finalSkillLevel,
          dietaryPreferences: useDefaults ? [] : dietaryPreferences,
          allergies: useDefaults ? [] : allergies,
          favoriteCuisines: useDefaults ? [] : favoriteCuisines,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Došlo je do greške");
        setLoading(false);
        return;
      }

      // Success - redirect to app
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError("Došlo je do greške. Molimo pokušajte ponovno.");
      setLoading(false);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <ChefHat className="w-12 h-12 text-orange-600" />
            <h1 className="text-4xl font-bold">Gurmania</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Dobrodošli! Personalizirajmo Vaše iskustvo.
          </p>
        </motion.div>

        {/* Progress indicator */}
        <div className="mb-8 flex flex-col items-center w-full px-4">
          <div className="flex justify-center items-center mb-2 gap-2 mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    index <= currentStep
                      ? "bg-orange-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-1 mx-2 rounded transition-colors ${
                      index < currentStep
                        ? "bg-orange-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            Korak {currentStep + 1} od {steps.length}
          </div>
        </div>

        {/* Main card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
            <CardDescription className="text-base">{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* Step 1: Skill Level */}
              {currentStep === 0 && (
                <motion.div key="step-0" {...fadeInUp} className="space-y-4">
                  <div className="grid gap-4">
                    {SKILL_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setSkillLevel(level.value)}
                        className={`p-6 border-2 rounded-lg text-left transition-all hover:border-orange-300 ${
                          skillLevel === level.value
                            ? "border-orange-600 bg-orange-50 dark:bg-orange-950/20"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-lg mb-1">{level.label}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {level.value === "BEGINNER" &&
                                "Tek počinjem svoje kulinarske avanture"}
                              {level.value === "INTERMEDIATE" &&
                                "Imam osnovno znanje i iskustvo u kuhanju"}
                              {level.value === "ADVANCED" &&
                                "Iskusan sam kuhar koji želi usavršiti tehnike"}
                            </p>
                          </div>
                          {skillLevel === level.value && (
                            <Check className="w-6 h-6 text-orange-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Dietary Preferences */}
              {currentStep === 1 && (
                <motion.div key="step-1" {...fadeInUp} className="space-y-4">
                  <Label className="text-base">
                    Odaberite sve prehrambene preferencije koje pratite (opcionalno):
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_PREFERENCES.map((pref) => (
                      <Badge
                        key={pref}
                        variant={dietaryPreferences.includes(pref) ? "default" : "outline"}
                        className={`cursor-pointer text-sm px-4 py-2 ${
                          dietaryPreferences.includes(pref)
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "hover:border-orange-300"
                        }`}
                        onClick={() => toggleSelection(pref, dietaryPreferences, setDietaryPreferences)}
                      >
                        {pref}
                      </Badge>
                    ))}
                  </div>
                  {dietaryPreferences.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Odabrano: {dietaryPreferences.length} preferencij{dietaryPreferences.length === 1 ? "a" : "e"}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 3: Allergens */}
              {currentStep === 2 && (
                <motion.div key="step-2" {...fadeInUp} className="space-y-4">
                  <Label className="text-base">
                    Odaberite alergene na koje trebamo paziti (opcionalno):
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGENS.map((allergen) => (
                      <Badge
                        key={allergen}
                        variant={allergies.includes(allergen) ? "default" : "outline"}
                        className={`cursor-pointer text-sm px-4 py-2 ${
                          allergies.includes(allergen)
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "hover:border-orange-300"
                        }`}
                        onClick={() => toggleSelection(allergen, allergies, setAllergies)}
                      >
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                  {allergies.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Odabrano: {allergies.length} alergen{allergies.length === 1 ? "" : "a"}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 4: Favorite Cuisines */}
              {currentStep === 3 && (
                <motion.div key="step-3" {...fadeInUp} className="space-y-4">
                  <Label className="text-base">
                    Koje kuhinje Vas najviše zanimaju? (opcionalno):
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_TYPES.map((cuisine) => (
                      <Badge
                        key={cuisine}
                        variant={favoriteCuisines.includes(cuisine) ? "default" : "outline"}
                        className={`cursor-pointer text-sm px-4 py-2 ${
                          favoriteCuisines.includes(cuisine)
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "hover:border-orange-300"
                        }`}
                        onClick={() => toggleSelection(cuisine, favoriteCuisines, setFavoriteCuisines)}
                      >
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                  {favoriteCuisines.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Odabrano: {favoriteCuisines.length} kuhinj{favoriteCuisines.length === 1 ? "a" : "e"}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 bg-destructive/15 text-destructive rounded-md text-sm"
              >
                {error}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Natrag
          </Button>
          {!isLastStep ? (
            <Button onClick={handleNext} disabled={loading} className="gap-2 bg-orange-600 hover:bg-orange-700">
              Dalje
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="gap-2 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Spremanje..." : "Završi"}
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Skip option */}
        <div className="text-center mt-4">
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Spremanje..." : "Preskoči za sada"}
          </button>
        </div>
      </div>
    </div>
  );
}
