"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAirportByIata, normalizeIataCode } from "@/lib/flights/airports";
import {
  createFlight,
  createFlightFromLookup,
  FlightsApiError,
  lookupFlight,
  updateFlight,
  type CreateFlightPayload,
} from "@/lib/flights/api";
import { formatDistanceKm } from "@/lib/flights/distance";
import { lookupResultToCreatePayload } from "@/lib/flights/mappers";
import {
  isValidDateString,
  isValidFlightNumber,
  normalizeFlightNumber,
} from "@/lib/flights/normalize-flight-number";
import { type FlightLookupResult } from "@/lib/flights/providers/types";
import {
  computeDurationMinutes,
  formatLocalDateTime,
  formatDurationMinutes,
} from "@/lib/flights/time-matching";
import {
  cabinClasses,
  type CabinClass,
  type CreateFlightInput,
  type Flight,
} from "@/lib/flights/types";
import { getTodayDateString } from "@/lib/jobfind/utils";
import { cn } from "@/lib/utils";

type AddFlightStep = "lookup" | "select" | "review" | "manual";

export interface FlightFormValues {
  flightNumber: string;
  airline: string;
  departureIata: string;
  arrivalIata: string;
  departureDate: string;
  aircraft: string;
  cabinClass: CabinClass | "";
  seat: string;
  notes: string;
}

interface AddFlightFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (flight: Flight) => void;
  editingFlight?: Flight | null;
  onViewExistingFlight?: (flight: Flight) => void;
}

function createEmptyManualValues(): FlightFormValues {
  return {
    flightNumber: "",
    airline: "",
    departureIata: "",
    arrivalIata: "",
    departureDate: getTodayDateString(),
    aircraft: "",
    cabinClass: "",
    seat: "",
    notes: "",
  };
}

function flightToManualValues(flight: Flight): FlightFormValues {
  return {
    flightNumber: flight.flightNumber ?? "",
    airline: flight.airline ?? "",
    departureIata: flight.departureIata,
    arrivalIata: flight.arrivalIata,
    departureDate: flight.departureDate,
    aircraft: flight.aircraft ?? "",
    cabinClass: flight.cabinClass ?? "",
    seat: flight.seat ?? "",
    notes: flight.notes ?? "",
  };
}

function toManualPayload(values: FlightFormValues): CreateFlightInput {
  return {
    flightNumber: normalizeFlightNumber(values.flightNumber),
    airline: values.airline.trim(),
    departureIata: normalizeIataCode(values.departureIata),
    arrivalIata: normalizeIataCode(values.arrivalIata),
    departureDate: values.departureDate,
    aircraft: values.aircraft.trim() || null,
    cabinClass: values.cabinClass || null,
    seat: values.seat.trim() || null,
    notes: values.notes.trim() || null,
  };
}

export function AddFlightForm({
  open,
  onClose,
  onSuccess,
  editingFlight = null,
  onViewExistingFlight,
}: AddFlightFormProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close add flight panel"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] md:bg-black/40"
        onClick={onClose}
      />

      <AddFlightFormContent
        key={editingFlight?.id ?? "new-flight"}
        editingFlight={editingFlight}
        onClose={onClose}
        onSuccess={onSuccess}
        onViewExistingFlight={onViewExistingFlight}
      />
    </>
  );
}

function AddFlightFormContent({
  editingFlight,
  onClose,
  onSuccess,
  onViewExistingFlight,
}: {
  editingFlight: Flight | null;
  onClose: () => void;
  onSuccess: (flight: Flight) => void;
  onViewExistingFlight?: (flight: Flight) => void;
}) {
  const abortRef = useRef<AbortController | null>(null);
  const [step, setStep] = useState<AddFlightStep>(
    editingFlight ? "manual" : "lookup"
  );
  const [flightNumber, setFlightNumber] = useState("");
  const [departureDate, setDepartureDate] = useState(getTodayDateString());
  const [manualForm, setManualForm] = useState<FlightFormValues>(
    editingFlight ? flightToManualValues(editingFlight) : createEmptyManualValues()
  );
  const [matches, setMatches] = useState<FlightLookupResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<FlightLookupResult | null>(
    null
  );
  const [optionalSeat, setOptionalSeat] = useState("");
  const [optionalNotes, setOptionalNotes] = useState("");
  const [optionalCabinClass, setOptionalCabinClass] = useState<CabinClass | "">("");
  const [duplicateFlight, setDuplicateFlight] = useState<Flight | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupSuggestions, setLookupSuggestions] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function resetLookupErrors() {
    setError(null);
    setLookupSuggestions([]);
    setFieldErrors({});
  }

  function validateLookupInput(): boolean {
    const errors: Record<string, string[]> = {};
    const normalizedNumber = normalizeFlightNumber(flightNumber);

    if (!isValidFlightNumber(normalizedNumber)) {
      errors.flightNumber = ["Enter a valid flight number."];
    }
    if (!isValidDateString(departureDate)) {
      errors.departureDate = ["Enter a valid date."];
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLookupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLookingUp) return;
    resetLookupErrors();

    if (!validateLookupInput()) {
      setError("Fix the highlighted fields before continuing.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLookingUp(true);

    try {
      const outcome = await lookupFlight(
        {
          flightNumber: normalizeFlightNumber(flightNumber),
          date: departureDate,
        },
        controller.signal
      );

      if (outcome.status === "none") {
        setLookupSuggestions(outcome.suggestions ?? []);
        setError(
          outcome.message ??
            "No matching flight was found. Check the flight number and date."
        );
        setManualForm({
          ...createEmptyManualValues(),
          flightNumber: normalizeFlightNumber(flightNumber),
          departureDate,
        });

        if (outcome.matches.length > 0) {
          setMatches(outcome.matches);
          setSelectedResult(outcome.matches[0] ?? null);
          setStep("select");
        }

        return;
      }

      setLookupSuggestions([]);

      setMatches(outcome.matches);

      if (outcome.status === "single" && outcome.bestMatch) {
        setSelectedResult(outcome.bestMatch);
        setStep("review");
        return;
      }

      if (
        outcome.status === "multiple" ||
        outcome.status === "ambiguous"
      ) {
        setSelectedResult(outcome.bestMatch ?? outcome.matches[0] ?? null);
        setStep("select");
        setError(outcome.message ?? null);
        return;
      }
    } catch (lookupError) {
      if (lookupError instanceof DOMException && lookupError.name === "AbortError") {
        return;
      }

      if (lookupError instanceof FlightsApiError) {
        if (lookupError.code === "CONFIGURATION_ERROR") {
          setError(
            `${lookupError.message} Get a free key at rapid.aerodatabox.com, paste it into AERODATABOX_API_KEY in .env.local, then restart npm run dev.`
          );
        } else {
          setError(lookupError.message);
        }
      } else {
        setError("The flight could not be looked up. Please try again.");
      }
    } finally {
      setIsLookingUp(false);
    }
  }

  async function saveSelectedResult(forceDuplicate = false) {
    if (!selectedResult || isSaving) return;

    setIsSaving(true);
    setError(null);
    setDuplicateFlight(null);

    try {
      const saved = await createFlightFromLookup(selectedResult, {
        departureDate,
        cabinClass: optionalCabinClass || null,
        seat: optionalSeat.trim() || null,
        notes: optionalNotes.trim() || null,
        forceDuplicate,
      });

      onSuccess(saved);
      onClose();
    } catch (saveError) {
      if (saveError instanceof FlightsApiError) {
        if (saveError.code === "DUPLICATE_FLIGHT" && saveError.duplicateFlight) {
          setDuplicateFlight(saveError.duplicateFlight);
          setError(saveError.message);
          return;
        }

        setError(saveError.message);
        if (saveError.fields) {
          setFieldErrors(saveError.fields);
        }
      } else {
        setError("The flight could not be saved. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function validateManualAirports(values: FlightFormValues) {
    const errors: Record<string, string[]> = {};
    const departure = getAirportByIata(values.departureIata);
    const arrival = getAirportByIata(values.arrivalIata);

    if (!/^[A-Z]{3}$/.test(normalizeIataCode(values.departureIata))) {
      errors.departureIata = ["Enter a valid three-letter IATA code."];
    } else if (!departure) {
      errors.departureIata = [
        `Airport code ${normalizeIataCode(values.departureIata)} was not found.`,
      ];
    }

    if (!/^[A-Z]{3}$/.test(normalizeIataCode(values.arrivalIata))) {
      errors.arrivalIata = ["Enter a valid three-letter IATA code."];
    } else if (!arrival) {
      errors.arrivalIata = [
        `Airport code ${normalizeIataCode(values.arrivalIata)} was not found.`,
      ];
    }

    return errors;
  }

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const airportErrors = validateManualAirports(manualForm);
    if (Object.keys(airportErrors).length > 0) {
      setFieldErrors(airportErrors);
      setError("Fix the highlighted airport codes before saving.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setDuplicateFlight(null);

    try {
      const payload = toManualPayload(manualForm);
      const saved = editingFlight
        ? await updateFlight(editingFlight.id, payload)
        : await createFlight(payload as CreateFlightPayload);

      onSuccess(saved);
      onClose();
    } catch (saveError) {
      if (saveError instanceof FlightsApiError) {
        if (saveError.code === "DUPLICATE_FLIGHT" && saveError.duplicateFlight) {
          setDuplicateFlight(saveError.duplicateFlight);
        }
        setError(saveError.message);
        if (saveError.fields) {
          setFieldErrors(saveError.fields);
        }
      } else {
        setError("The flight could not be saved. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const panelTitle =
    step === "review"
      ? "Review flight"
      : step === "select"
        ? "Select flight"
        : step === "manual"
          ? editingFlight
            ? "Edit flight"
            : "Enter flight manually"
          : "Add flight";

  return (
    <aside
      className={cn(
        "fixed z-50 flex h-[100dvh] w-full flex-col border-l border-[#303846]/80 bg-[#0E1219]/95 text-foreground shadow-2xl backdrop-blur-xl",
        "inset-x-0 bottom-0 md:inset-x-auto md:inset-y-0 md:right-0 md:w-full md:max-w-md"
      )}
    >
      <div className="flex items-center justify-between border-b border-[#303846]/70 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{panelTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {step === "lookup"
              ? "Look up your flight using the flight number and date."
              : step === "review"
                ? "Confirm the flight details before saving."
                : step === "select"
                  ? "Choose the flight you took."
                  : "Enter the route details manually."}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {step === "lookup" ? (
          <form id="flight-lookup-form" onSubmit={handleLookupSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lookup-flight-number">Flight number</Label>
              <Input
                id="lookup-flight-number"
                value={flightNumber}
                onChange={(event) =>
                  setFlightNumber(normalizeFlightNumber(event.target.value))
                }
                placeholder="AC103"
                required
              />
              {fieldErrors.flightNumber?.[0] ? (
                <p className="text-sm text-destructive">{fieldErrors.flightNumber[0]}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lookup-flight-date">Flight date</Label>
              <Input
                id="lookup-flight-date"
                type="date"
                value={departureDate}
                onChange={(event) => setDepartureDate(event.target.value)}
                required
              />
              {fieldErrors.departureDate?.[0] ? (
                <p className="text-sm text-destructive">{fieldErrors.departureDate[0]}</p>
              ) : null}
            </div>
          </form>
        ) : null}

        {step === "select" ? (
          <div className="space-y-3">
            {matches.map((match) => {
              const isSelected =
                selectedResult?.providerId === match.providerId &&
                selectedResult?.scheduledDepartureAt === match.scheduledDepartureAt;

              return (
                <button
                  key={`${match.providerId}-${match.scheduledDepartureAt}`}
                  type="button"
                  onClick={() => setSelectedResult(match)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/10"
                      : "border-[#303846]/80 bg-white/5 hover:bg-white/8"
                  )}
                >
                  <p className="font-medium">
                    {match.airlineName} {match.marketingFlightNumber}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {match.departure.iata} → {match.arrival.iata}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Departs {formatLocalDateTime(match.scheduledDepartureAt)}
                  </p>
                  {match.scheduledArrivalAt ? (
                    <p className="text-sm text-muted-foreground">
                      Arrives {formatLocalDateTime(match.scheduledArrivalAt)}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {match.aircraftModel ?? "Aircraft information unavailable"}
                  </p>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === "review" && selectedResult ? (
          <ReviewFlightDetails
            result={selectedResult}
            optionalCabinClass={optionalCabinClass}
            optionalSeat={optionalSeat}
            optionalNotes={optionalNotes}
            onCabinClassChange={setOptionalCabinClass}
            onSeatChange={setOptionalSeat}
            onNotesChange={setOptionalNotes}
          />
        ) : null}

        {step === "manual" ? (
          <ManualFlightForm
            form={manualForm}
            fieldErrors={fieldErrors}
            onChange={setManualForm}
            onSubmit={handleManualSubmit}
            isSaving={isSaving}
          />
        ) : null}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        {Object.keys(fieldErrors).length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-destructive">
            {Object.entries(fieldErrors).flatMap(([field, issues]) =>
              issues.map((issue) => (
                <li key={`${field}-${issue}`}>
                  {field}: {issue}
                </li>
              ))
            )}
          </ul>
        ) : null}

        {lookupSuggestions.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {lookupSuggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        ) : null}

        {duplicateFlight ? (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <p>This flight may already be in your history.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onViewExistingFlight?.(duplicateFlight)}
              >
                View existing flight
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDuplicateFlight(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void saveSelectedResult(true)}
                disabled={isSaving}
              >
                Save anyway
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#303846]/70 px-5 py-4">
        {step === "lookup" ? (
          <div className="space-y-3">
            <Button
              type="submit"
              form="flight-lookup-form"
              className="w-full"
              disabled={isLookingUp}
            >
              {isLookingUp ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Looking up your flight...
                </>
              ) : (
                "Look up flight"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                resetLookupErrors();
                setManualForm({
                  ...createEmptyManualValues(),
                  flightNumber: normalizeFlightNumber(flightNumber),
                  departureDate,
                });
                setStep("manual");
              }}
            >
              Enter flight manually
            </Button>
          </div>
        ) : null}

        {step === "select" ? (
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full"
              disabled={!selectedResult}
              onClick={() => setStep("review")}
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                resetLookupErrors();
                setStep("lookup");
              }}
            >
              Search again
            </Button>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full"
              disabled={isSaving}
              onClick={() => void saveSelectedResult(false)}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Confirm and Save"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                resetLookupErrors();
                setStep("lookup");
              }}
            >
              Search again
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                if (!selectedResult) return;
                setManualForm({
                  ...createEmptyManualValues(),
                  ...manualValuesFromLookup(selectedResult, departureDate),
                });
                setStep("manual");
              }}
            >
              Edit details manually
            </Button>
          </div>
        ) : null}

        {step === "manual" && !editingFlight ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              resetLookupErrors();
              setStep("lookup");
            }}
          >
            Back to lookup
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

function manualValuesFromLookup(
  result: FlightLookupResult,
  departureDate: string
): FlightFormValues {
  const payload = lookupResultToCreatePayload(result, { departureDate });
  return {
    flightNumber: payload.flightNumber,
    airline: payload.airline,
    departureIata: payload.departureIata,
    arrivalIata: payload.arrivalIata,
    departureDate: payload.departureDate,
    aircraft: payload.aircraft ?? "",
    cabinClass: "",
    seat: "",
    notes: "",
  };
}

function ReviewFlightDetails({
  result,
  optionalCabinClass,
  optionalSeat,
  optionalNotes,
  onCabinClassChange,
  onSeatChange,
  onNotesChange,
}: {
  result: FlightLookupResult;
  optionalCabinClass: CabinClass | "";
  optionalSeat: string;
  optionalNotes: string;
  onCabinClassChange: (value: CabinClass | "") => void;
  onSeatChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}) {
  const durationMinutes = computeDurationMinutes(
    result.scheduledDepartureAt,
    result.scheduledArrivalAt
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#303846]/80 bg-white/5 p-4">
        <p className="text-lg font-semibold">
          {result.airlineName} {result.marketingFlightNumber}
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <ReviewRow
            label="Departure"
            value={`${result.departure.name}, ${result.departure.city}, ${result.departure.country} (${result.departure.iata})`}
          />
          <ReviewRow
            label="Arrival"
            value={`${result.arrival.name}, ${result.arrival.city}, ${result.arrival.country} (${result.arrival.iata})`}
          />
          <ReviewRow
            label="Scheduled departure"
            value={formatLocalDateTime(result.scheduledDepartureAt)}
          />
          <ReviewRow
            label="Scheduled arrival"
            value={
              result.scheduledArrivalAt
                ? formatLocalDateTime(result.scheduledArrivalAt)
                : "Unavailable"
            }
          />
          <ReviewRow
            label="Aircraft"
            value={result.aircraftModel ?? "Aircraft information unavailable"}
          />
          <ReviewRow
            label="Distance"
            value={formatDistanceKm(result.distanceKm ?? null)}
          />
          {durationMinutes !== null ? (
            <ReviewRow
              label="Duration"
              value={formatDurationMinutes(durationMinutes)}
            />
          ) : null}
          <ReviewRow label="Status" value={result.status ?? "Unknown"} />
        </dl>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="review-cabin">Cabin class (optional)</Label>
          <Select
            value={optionalCabinClass || undefined}
            onValueChange={(value) => onCabinClassChange(value as CabinClass)}
          >
            <SelectTrigger id="review-cabin" className="w-full">
              <SelectValue placeholder="Select cabin class" />
            </SelectTrigger>
            <SelectContent>
              {cabinClasses.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-seat">Seat (optional)</Label>
          <Input
            id="review-seat"
            value={optionalSeat}
            onChange={(event) => onSeatChange(event.target.value.toUpperCase())}
            placeholder="12A"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-notes">Notes (optional)</Label>
          <Textarea
            id="review-notes"
            value={optionalNotes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="Optional trip notes"
          />
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}

function ManualFlightForm({
  form,
  fieldErrors,
  onChange,
  onSubmit,
  isSaving,
}: {
  form: FlightFormValues;
  fieldErrors: Record<string, string[]>;
  onChange: (form: FlightFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
}) {
  return (
    <form id="manual-flight-form" onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="manual-airline">Airline</Label>
          <Input
            id="manual-airline"
            value={form.airline}
            onChange={(event) =>
              onChange({ ...form, airline: event.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-flight-number">Flight number</Label>
          <Input
            id="manual-flight-number"
            value={form.flightNumber}
            onChange={(event) =>
              onChange({
                ...form,
                flightNumber: normalizeFlightNumber(event.target.value),
              })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-date">Departure date</Label>
          <Input
            id="manual-date"
            type="date"
            value={form.departureDate}
            onChange={(event) =>
              onChange({ ...form, departureDate: event.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-departure">Departure airport</Label>
          <Input
            id="manual-departure"
            value={form.departureIata}
            onChange={(event) =>
              onChange({
                ...form,
                departureIata: normalizeIataCode(event.target.value).slice(0, 3),
              })
            }
            maxLength={3}
            required
          />
          {fieldErrors.departureIata?.[0] ? (
            <p className="text-sm text-destructive">{fieldErrors.departureIata[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-arrival">Arrival airport</Label>
          <Input
            id="manual-arrival"
            value={form.arrivalIata}
            onChange={(event) =>
              onChange({
                ...form,
                arrivalIata: normalizeIataCode(event.target.value).slice(0, 3),
              })
            }
            maxLength={3}
            required
          />
          {fieldErrors.arrivalIata?.[0] ? (
            <p className="text-sm text-destructive">{fieldErrors.arrivalIata[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="manual-aircraft">Aircraft</Label>
          <Input
            id="manual-aircraft"
            value={form.aircraft}
            onChange={(event) =>
              onChange({ ...form, aircraft: event.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-cabin">Cabin class</Label>
          <Select
            value={form.cabinClass || undefined}
            onValueChange={(value) =>
              onChange({ ...form, cabinClass: value as CabinClass })
            }
          >
            <SelectTrigger id="manual-cabin" className="w-full">
              <SelectValue placeholder="Select cabin class" />
            </SelectTrigger>
            <SelectContent>
              {cabinClasses.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-seat">Seat</Label>
          <Input
            id="manual-seat"
            value={form.seat}
            onChange={(event) =>
              onChange({ ...form, seat: event.target.value.toUpperCase() })
            }
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="manual-notes">Notes</Label>
          <Textarea
            id="manual-notes"
            value={form.notes}
            onChange={(event) => onChange({ ...form, notes: event.target.value })}
            rows={4}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save flight"
        )}
      </Button>
    </form>
  );
}
