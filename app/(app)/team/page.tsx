"use client";

import { useState, useEffect } from "react";
import { UserPlus, Trash2, Key, Mail, Shield, Calendar, Copy, Check, Info, X } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useUserIdentity } from "@/lib/use-user-identity";
import { listApiKeys, createApiKey, deleteApiKey, type ApiKey, type CreateApiKeyRequest } from "@/lib/services/api-keys";
import { formatDistanceToNow } from "date-fns";

export default function TeamPage() {
  const { toast } = useToast();
  const { role, permissions, email: currentUserEmail, userId: currentUserId } = useUserIdentity();
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showNewMemberHint, setShowNewMemberHint] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"owner" | "manager" | "publisher" | "advertiser">("publisher");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["read", "write"]);

  // Check if user has permission to manage team
  const canManageTeam = role === "owner" || role === "manager";

  // Load team members
  useEffect(() => {
    if (!canManageTeam) {
      setIsLoading(false);
      return;
    }
    
    loadTeamMembers();
  }, [canManageTeam]);

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const keys = await listApiKeys('user'); // Only fetch users (with email)
      setApiKeys(keys);
    } catch (err) {
      console.error("Failed to load team members:", err);
      setError(err instanceof Error ? err.message : "Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Always include "read" permission
      const permissions = ["read"];
      if (selectedPermissions.includes("write")) {
        permissions.push("write");
      }
      
      const newKey: CreateApiKeyRequest = {
        email: email.trim(),
        role: selectedRole,
        permissions,
      };

      await createApiKey(newKey);
      
      toast({
        title: "Team member added",
        description: `${email} has been added to your team.`,
      });

      setShowNewMemberHint(true);
      setTimeout(() => setShowNewMemberHint(false), 90_000);

      // Reset form
      setEmail("");
      setSelectedRole("publisher");
      setSelectedPermissions(["read", "write"]);
      setIsDialogOpen(false);
      
      loadTeamMembers();
    } catch (err) {
      console.error("Failed to create team member:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add team member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (permission: string) => {
    // "read" permission is always required, cannot be toggled
    if (permission === "read") {
      return;
    }
    
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleRevokeClick = (key: ApiKey) => {
    setKeyToRevoke(key);
  };

  const handleRevokeConfirm = async () => {
    if (!keyToRevoke) return;
    setIsRevoking(true);
    try {
      await deleteApiKey(keyToRevoke.token);
      setKeyToRevoke(null);
      await loadTeamMembers();
      toast({
        title: "Access revoked",
        description: `${keyToRevoke.email || "Key"} has been revoked. They can no longer sign in.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove team member",
        variant: "destructive",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRevokeCancel = () => {
    if (!isRevoking) setKeyToRevoke(null);
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedToken(null);
      }, 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "owner":
        return "bg-purple-500/10 text-purple-500";
      case "manager":
        return "bg-blue-500/10 text-blue-500";
      case "publisher":
        return "bg-green-500/10 text-green-500";
      case "advertiser":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!canManageTeam) {
    return (
      <div className="container mx-auto min-w-0 max-w-full p-6">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">Team</h1>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <p className="text-sm text-destructive">
            You don't have permission to manage team members. Only owners and managers can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Team</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Create a new API key for a team member. They will be able to access the platform based on their role and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-3.5 w-3.5 mr-1" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">
                    <Shield className="inline h-3.5 w-3.5 mr-1" />
                    Role
                  </Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as any)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner - Full access</SelectItem>
                      <SelectItem value="manager">Manager - Manage team, settings, zones & campaigns</SelectItem>
                      <SelectItem value="publisher">Publisher - Manage zones</SelectItem>
                      <SelectItem value="advertiser">Advertiser - Manage campaigns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 opacity-75">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">Read - View data (always enabled)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes("write")}
                        onChange={() => togglePermission("write")}
                        disabled={isSubmitting}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">Write - Create and edit</span>
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Team Member"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {showNewMemberHint && (
        <div className="mb-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="text-sm flex-1">
            <p className="font-medium">New member added</p>
            <p className="mt-0.5 text-amber-800/90 dark:text-amber-200/90">
              They may take up to a minute to appear in the list below. Refresh the page if you don&apos;t see them yet.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-amber-700 hover:bg-amber-200/50 dark:text-amber-300 dark:hover:bg-amber-800/50"
            onClick={() => setShowNewMemberHint(false)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <UserPlus className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">No team members yet</p>
          <p className="text-muted-foreground text-sm max-w-sm mb-4">
            Add team members to collaborate on campaigns and zones.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Your First Team Member
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.token}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{key.email || "Legacy key"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(key.role)}`}>
                      {key.role || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {key.permissions.map((perm) => (
                        <span key={perm} className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => copyToken(key.token)}
                    >
                      {copiedToken === key.token ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy token
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {key.expires_at ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(key.expires_at), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {((key.email && key.email === currentUserEmail) || (key.user_id && currentUserId && key.user_id === currentUserId)) ? (
                      <span className="text-muted-foreground/50 text-xs">(you)</span>
                    ) : (key.expires_at != null && new Date(key.expires_at).getTime() <= Date.now()) ? (
                      <span className="text-muted-foreground/50 text-xs">Revoked</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRevokeClick(key)}
                        title="Revoke access"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!keyToRevoke} onOpenChange={(open) => !open && handleRevokeCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove team member</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke access for {keyToRevoke?.email || "this key"}? They will lose access immediately. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleRevokeCancel} disabled={isRevoking}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeConfirm} disabled={isRevoking}>
              {isRevoking ? "Revoking..." : "Revoke access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
