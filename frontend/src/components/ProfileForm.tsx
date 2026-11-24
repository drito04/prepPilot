import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { toFieldErrors } from '../api/fieldErrors';
import { TARGET_COMPANY_TYPES, updateProfile, type Profile } from '../api/profile';
import { formatDateTime } from '../lib/format';
import { Alert } from './Alert';
import { Button } from './Button';
import { FormField } from './FormField';
import { SelectField } from './SelectField';

interface Values {
  branch: string;
  graduationYear: string;
  cgpa: string;
  targetCompanyType: string;
}

const CGPA_PATTERN = /^\d{1,2}(\.\d{1,2})?$/;
const YEAR_PATTERN = /^\d{4}$/;

function toValues(profile: Profile): Values {
  return {
    branch: profile.branch ?? '',
    graduationYear: profile.graduationYear === null ? '' : String(profile.graduationYear),
    cgpa: profile.cgpa === null ? '' : String(profile.cgpa),
    targetCompanyType: profile.targetCompanyType ?? '',
  };
}

function validate(values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.cgpa !== '' && (!CGPA_PATTERN.test(values.cgpa) || Number(values.cgpa) > 10)) {
    errors.cgpa = 'Enter a number between 0 and 10 with up to 2 decimals.';
  }
  if (values.graduationYear !== '') {
    const year = Number(values.graduationYear);
    if (!YEAR_PATTERN.test(values.graduationYear) || year < 2000 || year > 2100) {
      errors.graduationYear = 'Enter a four-digit year between 2000 and 2100.';
    }
  }
  return errors;
}

export function ProfileForm({ initial }: { initial: Profile }) {
  const [values, setValues] = useState<Values>(() => toValues(initial));
  const [savedAt, setSavedAt] = useState<string | null>(initial.updatedAt);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onChange(field: keyof Values) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target;
      setValues((current) => ({ ...current, [field]: value }));
      setJustSaved(false);
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setJustSaved(false);

    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const saved = await updateProfile({
        branch: values.branch.trim() === '' ? null : values.branch.trim(),
        graduationYear: values.graduationYear === '' ? null : Number(values.graduationYear),
        cgpa: values.cgpa === '' ? null : Number(values.cgpa),
        targetCompanyType: values.targetCompanyType === '' ? null : values.targetCompanyType,
      });
      setValues(toValues(saved));
      setSavedAt(saved.updatedAt);
      setJustSaved(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details.length > 0) {
          setFieldErrors(toFieldErrors(err.details));
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {justSaved && <Alert variant="success">Profile saved.</Alert>}
      {formError && <Alert variant="error">{formError}</Alert>}

      <FormField
        label="Branch"
        placeholder="e.g. Computer Science and Engineering"
        maxLength={80}
        value={values.branch}
        onChange={onChange('branch')}
        error={fieldErrors.branch}
      />
      <FormField
        label="Graduation year"
        inputMode="numeric"
        maxLength={4}
        placeholder="e.g. 2026"
        value={values.graduationYear}
        onChange={onChange('graduationYear')}
        error={fieldErrors.graduationYear}
      />
      <FormField
        label="CGPA"
        inputMode="decimal"
        maxLength={5}
        placeholder="e.g. 8.5"
        value={values.cgpa}
        onChange={onChange('cgpa')}
        error={fieldErrors.cgpa}
        hint="On a scale of 0 to 10."
      />
      <SelectField
        label="Target company type"
        value={values.targetCompanyType}
        onChange={onChange('targetCompanyType')}
        error={fieldErrors.targetCompanyType}
      >
        <option value="">Select one</option>
        {TARGET_COMPANY_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </SelectField>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {savedAt ? `Last saved ${formatDateTime(savedAt)}.` : 'Not saved yet.'}
        </p>
        <Button type="submit" disabled={saving} className="sm:w-auto">
          {saving ? 'Saving...' : 'Save profile'}
        </Button>
      </div>
    </form>
  );
}