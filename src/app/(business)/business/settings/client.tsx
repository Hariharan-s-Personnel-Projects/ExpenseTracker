"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Settings2,
  Plus,
  Trash2,
  Copy,
  Check,
  Lock,
  Phone,
  Mail,
  Globe,
  MapPin,
  Save,
  Upload,
  X,
  Building2,
  Palette,
  RotateCcw,
  Wand2,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  updateBusinessPassword,
  deleteBusinessAccount,
  updateBusinessContact,
  updateBusinessLogo,
  removeBusinessLogo,
  updateCatalogBranding,
  extractWebsiteTheme,
} from "@/actions/business-auth";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface Category {
  id: string;
  name: string;
  monthly_budget: number | null;
}

interface ContactInfo {
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
}

interface Props {
  businessInfo: {
    id: string;
    name: string;
    industry: string | null;
    invite_code: string | null;
    currency: string;
    logo_url: string | null;
    logo_storage_path: string | null;
    brand_color: string | null;
  } | null;
  categories: Category[];
  contactInfo: ContactInfo | null;
  role: "owner" | "admin" | "member" | "sales";
  hasPassword: boolean;
}

type Tab = "general" | "contact" | "appearance";

function ChangePasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [needsCurrentPassword, setNeedsCurrentPassword] = useState(hasPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPending(true);

    const formData = new FormData();
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);
    if (needsCurrentPassword) formData.set("currentPassword", currentPassword);

    const result = await updateBusinessPassword(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(needsCurrentPassword ? "Password updated successfully" : "Password set successfully");
      setNeedsCurrentPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setPending(false);
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {needsCurrentPassword ? "Change Password" : "Set Password"}
        </CardTitle>
        <CardDescription className="text-xs">
          {needsCurrentPassword
            ? "Update your password. You'll need your current password for verification."
            : "Set a password so you can sign in with your email and password."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {needsCurrentPassword && (
            <div className="space-y-1.5">
              <Label htmlFor="biz-current-password" className="text-sm">
                Current Password
              </Label>
              <Input
                id="biz-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="bg-muted/30 border-border/50 h-9"
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="biz-new-password" className="text-sm">
              New Password
            </Label>
            <Input
              id="biz-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="bg-muted/30 border-border/50 h-9"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-confirm-password" className="text-sm">
              Confirm New Password
            </Label>
            <Input
              id="biz-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="bg-muted/30 border-border/50 h-9"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" size="sm" className="gap-2 h-9" disabled={pending}>
            <Lock className="h-3.5 w-3.5" />
            {pending ? "Updating..." : needsCurrentPassword ? "Update Password" : "Set Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteBusinessCard({ businessName }: { businessName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) setInput("");
  }

  async function handleDelete() {
    setPending(true);
    const result = await deleteBusinessAccount(input);
    if (result?.error) {
      toast.error(result.error);
      setPending(false);
    } else {
      toast.success("Business account deleted");
      router.push("/business/login");
    }
  }

  const nameMatches = input.trim() === businessName.trim();

  return (
    <Card className="border-destructive/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-destructive">Delete Business Account</CardTitle>
        <CardDescription className="text-xs">
          Archive this business and all its data — expenses, members, products, and sales. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={
              <Button variant="destructive" size="sm" className="h-9 gap-2" />
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Business Account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Business Account</DialogTitle>
              <DialogDescription>
                This will permanently archive{" "}
                <strong className="text-foreground">{businessName}</strong> and
                all associated data. Type the business name below to confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5 py-1">
              <Label htmlFor="confirm-biz-name" className="text-sm">
                Type{" "}
                <span className="font-mono font-semibold">{businessName}</span>{" "}
                to confirm
              </Label>
              <Input
                id="confirm-biz-name"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={businessName}
                className="bg-muted/30 border-border/50 h-9"
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogClose>
              <Button
                variant="destructive"
                size="sm"
                disabled={!nameMatches || pending}
                onClick={handleDelete}
              >
                {pending ? "Deleting..." : "Delete Business"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ContactInfoCard({ initial }: { initial: ContactInfo | null }) {
  const [pending, setPending] = useState(false);
  const [fields, setFields] = useState<ContactInfo>({
    contact_phone: initial?.contact_phone ?? "",
    contact_email: initial?.contact_email ?? "",
    website: initial?.website ?? "",
    address_line1: initial?.address_line1 ?? "",
    address_line2: initial?.address_line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    country: initial?.country ?? "",
    postal_code: initial?.postal_code ?? "",
  });

  function set(key: keyof ContactInfo, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData();
    (Object.keys(fields) as (keyof ContactInfo)[]).forEach((k) => {
      formData.set(k, fields[k] ?? "");
    });
    const result = await updateBusinessContact(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Contact information saved");
    }
    setPending(false);
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Contact Information</CardTitle>
        <CardDescription className="text-xs">
          Public-facing contact details for your business.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Phone + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_phone" className="text-sm flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone
              </Label>
              <Input
                id="contact_phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={fields.contact_phone ?? ""}
                onChange={(e) => set("contact_phone", e.target.value)}
                className="bg-muted/30 border-border/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_email" className="text-sm flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Business Email
              </Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@yourcompany.com"
                value={fields.contact_email ?? ""}
                onChange={(e) => set("contact_email", e.target.value)}
                className="bg-muted/30 border-border/50 h-9"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-sm flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourcompany.com"
              value={fields.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
              className="bg-muted/30 border-border/50 h-9"
            />
          </div>

          {/* Address */}
          <div className="space-y-3 pt-1 border-t border-border/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pt-2">
              <MapPin className="h-3.5 w-3.5" /> Address
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="address_line1" className="text-sm">
                Address Line 1
              </Label>
              <Input
                id="address_line1"
                placeholder="Street address, P.O. box"
                value={fields.address_line1 ?? ""}
                onChange={(e) => set("address_line1", e.target.value)}
                className="bg-muted/30 border-border/50 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address_line2" className="text-sm">
                Address Line 2
              </Label>
              <Input
                id="address_line2"
                placeholder="Apartment, suite, unit, building (optional)"
                value={fields.address_line2 ?? ""}
                onChange={(e) => set("address_line2", e.target.value)}
                className="bg-muted/30 border-border/50 h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-sm">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={fields.city ?? ""}
                  onChange={(e) => set("city", e.target.value)}
                  className="bg-muted/30 border-border/50 h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-sm">State / Province</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={fields.state ?? ""}
                  onChange={(e) => set("state", e.target.value)}
                  className="bg-muted/30 border-border/50 h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="postal_code" className="text-sm">Postal Code</Label>
                <Input
                  id="postal_code"
                  placeholder="600001"
                  value={fields.postal_code ?? ""}
                  onChange={(e) => set("postal_code", e.target.value)}
                  className="bg-muted/30 border-border/50 h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-sm">Country</Label>
                <Input
                  id="country"
                  placeholder="India"
                  value={fields.country ?? ""}
                  onChange={(e) => set("country", e.target.value)}
                  className="bg-muted/30 border-border/50 h-9"
                />
              </div>
            </div>
          </div>

          <Button type="submit" size="sm" className="gap-2 h-9" disabled={pending}>
            <Save className="h-3.5 w-3.5" />
            {pending ? "Saving..." : "Save Contact Info"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const BRAND_SWATCHES = [
  "#1a73e8", "#e53935", "#2e7d32", "#f57c00",
  "#6200ea", "#00838f", "#d81b60", "#0277bd",
  "#4e342e", "#37474f", "#558b2f", "#ef6c00",
];

function CatalogAppearanceCard({
  initial,
  websiteUrl,
}: {
  initial: string | null;
  websiteUrl: string | null;
}) {
  const [color, setColor] = useState<string>(initial ?? "#3b82f6");
  const [hexInput, setHexInput] = useState<string>(initial ?? "#3b82f6");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  function applyColor(hex: string) {
    setColor(hex);
    setHexInput(hex);
  }

  function handleHexBlur() {
    if (/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
      setColor(hexInput);
    } else {
      setHexInput(color);
    }
  }

  async function handleExtract() {
    if (!websiteUrl) return;
    setExtracting(true);
    const result = await extractWebsiteTheme(websiteUrl);
    if (result.color) {
      applyColor(result.color);
      toast.success("Brand color extracted from your website");
    } else {
      toast.error(result.error ?? "Could not extract brand color");
    }
    setExtracting(false);
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateCatalogBranding(color);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Catalog branding saved");
    }
    setSaving(false);
  }

  async function handleReset() {
    setSaving(true);
    const result = await updateCatalogBranding(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      applyColor("#3b82f6");
      toast.success("Branding reset to default");
    }
    setSaving(false);
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Catalog Appearance
        </CardTitle>
        <CardDescription className="text-xs">
          Choose a brand color that will be applied to your customer-facing catalog and internal catalog header.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Extract from website */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
          <div className="min-w-0">
            <p className="text-sm font-medium">Auto-detect from website</p>
            {websiteUrl ? (
              <p className="text-xs text-muted-foreground truncate">{websiteUrl}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Add your website URL in the Contact tab first
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs shrink-0"
            disabled={!websiteUrl || extracting}
            onClick={handleExtract}
          >
            {extracting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {extracting ? "Detecting..." : "Extract Theme"}
          </Button>
        </div>

        {/* Color swatches */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Choose Color
          </p>
          <div className="flex flex-wrap gap-2">
            {BRAND_SWATCHES.map((swatch) => (
              <button
                key={swatch}
                onClick={() => applyColor(swatch)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  color === swatch
                    ? "border-foreground scale-110 shadow-md"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ background: swatch }}
                title={swatch}
              />
            ))}
          </div>
        </div>

        {/* Hex input + native color wheel */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="color"
              value={color}
              onChange={(e) => applyColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="w-9 h-9 rounded-lg border border-border/50 shadow-sm cursor-pointer"
              style={{ background: color }}
            />
          </div>
          <Input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={handleHexBlur}
            onKeyDown={(e) => e.key === "Enter" && handleHexBlur()}
            placeholder="#3b82f6"
            maxLength={7}
            className="bg-muted/30 border-border/50 h-9 w-32 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">or enter a hex code</p>
        </div>

        {/* Live preview */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Live Preview
          </p>
          <div className="rounded-xl border border-border/50 overflow-hidden bg-background shadow-sm">
            {/* Accent bar */}
            <div
              className="h-1.5 w-full"
              style={{
                background: `linear-gradient(to right, ${color}cc, ${color}, ${color}99)`,
              }}
            />
            {/* Mock product card */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full border"
                  style={{
                    background: color + "20",
                    color: color,
                    borderColor: color + "40",
                  }}
                >
                  Silk Collection
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-lg bg-muted/60 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Kanjivaram Saree</p>
                  <p className="text-xs text-muted-foreground">Premium silk — gold zari work</p>
                  <p
                    className="text-base font-semibold"
                    style={{ color }}
                  >
                    ₹12,500
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="gap-1.5 h-9"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Branding"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-9"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsClient({
  businessInfo,
  categories: initialCategories,
  contactInfo,
  role,
  hasPassword,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCatName, setNewCatName] = useState("");
  const [newCatBudget, setNewCatBudget] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [logoUrl, setLogoUrl] = useState<string | null>(businessInfo?.logo_url ?? null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(file: File) {
    if (!businessInfo) {
      toast.error("Business info unavailable. Please refresh the page and try again.");
      return;
    }
    setLogoUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${businessInfo.id}/logo/logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      setLogoUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    // Remove old logo from storage if there was one
    if (businessInfo.logo_storage_path) {
      await supabase.storage.from("product-images").remove([businessInfo.logo_storage_path]);
    }

    const res = await updateBusinessLogo(publicUrl, storagePath);
    if (res?.error) {
      toast.error(res.error);
      await supabase.storage.from("product-images").remove([storagePath]);
    } else {
      setLogoUrl(publicUrl);
      toast.success("Logo updated");
    }
    setLogoUploading(false);
  }

  async function handleLogoRemove() {
    if (!businessInfo?.logo_storage_path) return;
    setLogoUploading(true);
    const supabase = createClient();
    await supabase.storage.from("product-images").remove([businessInfo.logo_storage_path]);
    const res = await removeBusinessLogo();
    if (res?.error) {
      toast.error(res.error);
    } else {
      setLogoUrl(null);
      toast.success("Logo removed");
    }
    setLogoUploading(false);
  }

  const isManagement = role === "owner" || role === "admin";

  function copyInviteCode() {
    if (businessInfo?.invite_code) {
      navigator.clipboard.writeText(businessInfo.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function addCategory() {
    if (!newCatName.trim() || !businessInfo) return;
    setIsAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("business_categories")
      .insert({
        business_id: businessInfo.id,
        name: newCatName.trim(),
        monthly_budget: newCatBudget ? parseFloat(newCatBudget) : null,
      })
      .select("id, name, monthly_budget")
      .single();

    if (error) {
      toast.error(error.message);
    } else if (data) {
      setCategories((prev) => [...prev, data]);
      setNewCatName("");
      setNewCatBudget("");
      toast.success("Category added");
    }
    setIsAdding(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("business_categories")
      .delete()
      .eq("id", id);

    if (error) toast.error(error.message);
    else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6 max-w-2xl"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" />
          {isManagement ? "Business Settings" : "Settings"}
        </h1>
      </motion.div>

      {/* Member — only change password, no tabs */}
      {!isManagement && (
        <motion.div variants={fadeUp}>
          <ChangePasswordCard hasPassword={hasPassword} />
        </motion.div>
      )}

      {/* Management — tabbed */}
      {isManagement && (
        <>
          {/* Tab switcher */}
          <motion.div variants={fadeUp}>
            <div className="relative flex rounded-xl bg-muted/40 p-1 border border-border/50 w-fit">
              <motion.div
                className="absolute inset-y-1 rounded-lg bg-background border border-border/50 shadow-sm"
                style={{ width: "calc(33.33% - 2px)" }}
                animate={{
                  x: activeTab === "general"
                    ? 2
                    : activeTab === "contact"
                    ? "calc(100% + 2px)"
                    : "calc(200% + 2px)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              {(["general", "contact", "appearance"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`relative z-10 px-5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 capitalize ${
                    activeTab === t
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "general" ? "General" : t === "contact" ? "Contact" : "Appearance"}
                </button>
              ))}
            </div>
          </motion.div>

          {activeTab === "general" && (
            <>
              {/* Business info */}
              <motion.div variants={fadeUp}>
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {/* Logo section */}
                    <div className="flex items-center gap-4 pb-3 border-b border-border/30">
                      <div className="relative shrink-0">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt="Business logo"
                            width={64}
                            height={64}
                            className="rounded-xl object-cover border border-border/50 bg-muted/30"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-border/50 bg-muted/30 flex items-center justify-center">
                            <Building2 className="h-7 w-7 text-muted-foreground/50" />
                          </div>
                        )}
                        {logoUrl && (
                          <button
                            onClick={handleLogoRemove}
                            disabled={logoUploading}
                            className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-background border border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all shadow-sm"
                            title="Remove logo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1">Business Logo</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          PNG, JPG or WebP. Recommended 256×256px.
                        </p>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                            e.target.value = "";
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs"
                          disabled={logoUploading}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {logoUploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{businessInfo?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/30 pb-2">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{businessInfo?.industry ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Invite Code</span>
                      <button
                        onClick={copyInviteCode}
                        className="flex items-center gap-2 font-mono text-primary text-xs bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        {businessInfo?.invite_code}
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Expense categories */}
              <motion.div variants={fadeUp}>
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Expense Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="divide-y divide-border/30">
                      {categories.map((c) => (
                        <div key={c.id} className="flex items-center justify-between py-2.5">
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            {c.monthly_budget && (
                              <p className="text-xs text-muted-foreground">
                                Budget: ₹{Number(c.monthly_budget).toLocaleString("en-IN")} / month
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteCategory(c.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border/30 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Add Category
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Category name"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          className="bg-muted/30 border-border/50 h-9 flex-1"
                          onKeyDown={(e) => e.key === "Enter" && addCategory()}
                        />
                        <Input
                          placeholder="Budget (optional)"
                          type="number"
                          value={newCatBudget}
                          onChange={(e) => setNewCatBudget(e.target.value)}
                          className="bg-muted/30 border-border/50 h-9 w-36"
                        />
                        <Button
                          size="sm"
                          className="h-9 gap-1.5 shrink-0"
                          onClick={addCategory}
                          disabled={!newCatName.trim() || isAdding}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Change password */}
              <motion.div variants={fadeUp}>
                <ChangePasswordCard hasPassword={hasPassword} />
              </motion.div>

              {/* Delete business — owner only */}
              {role === "owner" && businessInfo && (
                <motion.div variants={fadeUp}>
                  <DeleteBusinessCard businessName={businessInfo.name} />
                </motion.div>
              )}
            </>
          )}

          {activeTab === "contact" && (
            <motion.div variants={fadeUp}>
              <ContactInfoCard initial={contactInfo} />
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div variants={fadeUp}>
              <CatalogAppearanceCard
                initial={businessInfo?.brand_color ?? null}
                websiteUrl={contactInfo?.website ?? null}
              />
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
