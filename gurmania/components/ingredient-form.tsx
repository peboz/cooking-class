"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { MEASUREMENT_UNITS } from '@/lib/constants';
import { Card } from '@/components/ui/card';

export interface IngredientData {
  name: string;
  quantity: number | null;
  unit: string;
  optional: boolean;
}

interface IngredientFormProps {
  ingredients: IngredientData[];
  onChange: (ingredients: IngredientData[]) => void;
}

export function IngredientForm({ ingredients, onChange }: IngredientFormProps) {
  const [localIngredients, setLocalIngredients] = useState<IngredientData[]>(ingredients);

  useEffect(() => {
    setLocalIngredients(ingredients);
  }, [ingredients]);

  const addIngredient = () => {
    const newIngredients = [
      ...localIngredients,
      { name: '', quantity: null, unit: 'g', optional: false },
    ];
    setLocalIngredients(newIngredients);
    onChange(newIngredients);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = localIngredients.filter((_, i) => i !== index);
    setLocalIngredients(newIngredients);
    onChange(newIngredients);
  };

  const updateIngredient = (index: number, field: keyof IngredientData, value: string | number | boolean | null) => {
    const newIngredients = localIngredients.map((ing, i) => {
      if (i === index) {
        return { ...ing, [field]: value };
      }
      return ing;
    });
    setLocalIngredients(newIngredients);
    onChange(newIngredients);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Sastojci</Label>
        <Button type="button" size="sm" onClick={addIngredient} className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj sastojak
        </Button>
      </div>

      {localIngredients.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          Nema dodanih sastojaka. Kliknite &quot;Dodaj sastojak&quot; za početak.
        </Card>
      ) : (
        <div className="space-y-3">
          {localIngredients.map((ingredient, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-12 gap-3 items-end">
                {/* Name */}
                <div className="col-span-12 sm:col-span-5">
                  <Label htmlFor={`ingredient-name-${index}`} className="text-xs">
                    Naziv
                  </Label>
                  <Input
                    id={`ingredient-name-${index}`}
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    placeholder="npr. Brašno"
                  />
                </div>

                {/* Quantity */}
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor={`ingredient-quantity-${index}`} className="text-xs">
                    Količina
                  </Label>
                  <Input
                    id={`ingredient-quantity-${index}`}
                    type="number"
                    step="0.1"
                    value={ingredient.quantity || ''}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0"
                  />
                </div>

                {/* Unit */}
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor={`ingredient-unit-${index}`} className="text-xs">
                    Jedinica
                  </Label>
                  <Select
                    value={ingredient.unit}
                    onValueChange={(value) => updateIngredient(index, 'unit', value)}
                  >
                    <SelectTrigger id={`ingredient-unit-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Optional */}
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor={`ingredient-optional-${index}`} className="text-xs">
                    Opcionalno
                  </Label>
                  <div className="flex items-center h-10">
                    <input
                      id={`ingredient-optional-${index}`}
                      type="checkbox"
                      checked={ingredient.optional}
                      onChange={(e) => updateIngredient(index, 'optional', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </div>
                </div>

                {/* Delete */}
                <div className="col-span-6 sm:col-span-1">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
