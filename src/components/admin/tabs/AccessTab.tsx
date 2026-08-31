"use client";

import React, { useState } from "react";
import { BaseTabProps } from "../adminTypes";
import { ADMIN_I18N } from "../adminConstants";
import {
  AdminUser,
  AdminRole,
  SUPERADMIN_EMAIL,
  saveAdminUsers,
} from "@/lib/adminAuth";
import {
  isValidName,
  isValidEmail,
  isValidPassword,
} from "@/lib/validation";
import {
  ShieldCheck,
  UserGear,
  Plus,
  Trash,
  PencilSimple,
  CircleNotch,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";

interface AccessTabProps extends BaseTabProps {
  adminUsersList: AdminUser[];
  setAdminUsersList: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  showAddModalInitial?: boolean;
}

export function AccessTab({
  lang,
  adminFetch,
  dialogAlert,
  dialogConfirm,
  session,
  adminUsersList,
  setAdminUsersList,
  showAddModalInitial = false,
}: AccessTabProps) {
  const t = ADMIN_I18N[lang];
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(
    showAddModalInitial
  );
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "admin" as AdminRole,
    password: "",
  });

  const handleStartEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password || "",
    });
    setShowAddUserModal(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!userForm.name.trim() || !isValidName(userForm.name)) {
      dialogAlert({
        title: lang === "ne" ? "नाम आवश्यक छ" : "Name Required",
        description:
          lang === "ne"
            ? "कृपया प्रशासकको पूरा नाम (कम्तिमा २ अक्षर) लेख्नुहोस्।"
            : "Please enter a valid administrator name (min 2 characters).",
        type: "warning",
      });
      return;
    }
    if (!isValidEmail(userForm.email)) {
      dialogAlert({
        title: lang === "ne" ? "अमान्य इमेल" : "Invalid Email",
        description:
          lang === "ne"
            ? "कृपया मान्य आधिकारिक इमेल ठेगाना लेख्नुहोस्।"
            : "Please enter a valid official email address.",
        type: "warning",
      });
      return;
    }
    if (!editingUser || userForm.password) {
      const passCheck = isValidPassword(userForm.password);
      if (!passCheck.isValid) {
        dialogAlert({
          title: lang === "ne" ? "कमजोर पासवर्ड" : "Weak Password",
          description: lang === "ne" ? passCheck.errorNe : passCheck.errorEn,
          type: "warning",
        });
        return;
      }
    }

    setIsSavingUser(true);
    try {
      if (editingUser) {
        const payload: Partial<AdminUser> & { id: string } = {
          id: editingUser.id,
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          ...(userForm.password ? { password: userForm.password } : {}),
        };

        try {
          const res = await adminFetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            dialogAlert({
              title: lang === "ne" ? "कार्य असफल" : "Action Failed",
              description:
                data.error ||
                (lang === "ne"
                  ? "प्रशासक खाता अद्यावधिक गर्न सकिएन।"
                  : "Failed to update administrator."),
              type: "danger",
            });
            return;
          }

          if (data.users) {
            setAdminUsersList(data.users);
            saveAdminUsers(data.users);
          }
        } catch {
          dialogAlert({
            title: lang === "ne" ? "कार्य असफल" : "Action Failed",
            description:
              lang === "ne"
                ? "सर्भरसँग सम्पर्क हुन सकेन।"
                : "Network or server error occurred.",
            type: "danger",
          });
          return;
        }

        setShowAddUserModal(false);
        setEditingUser(null);
        setUserForm({ name: "", email: "", role: "admin", password: "" });
        dialogAlert({
          title: lang === "ne" ? "खाता अद्यावधिक भयो" : "Account Updated",
          description: `${userForm.name} (${userForm.email}) ${
            lang === "ne" ? "सफलतापूर्वक अद्यावधिक भयो।" : "updated successfully."
          }`,
          type: "success",
        });
      } else {
        const newUserPayload = {
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          password: userForm.password,
          addedBy: session.email,
        };

        try {
          const res = await adminFetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUserPayload),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            dialogAlert({
              title: lang === "ne" ? "कार्य असफल" : "Action Failed",
              description:
                data.error ||
                (lang === "ne"
                  ? "नयाँ प्रशासक खाता सिर्जना गर्न सकिएन।"
                  : "Failed to create administrator."),
              type: "danger",
            });
            return;
          }

          if (data.users) {
            setAdminUsersList(data.users);
            saveAdminUsers(data.users);
          }
        } catch {
          dialogAlert({
            title: lang === "ne" ? "कार्य असफल" : "Action Failed",
            description:
              lang === "ne"
                ? "सर्भरसँग सम्पर्क हुन सकेन।"
                : "Network or server error occurred.",
            type: "danger",
          });
          return;
        }

        setShowAddUserModal(false);
        setUserForm({ name: "", email: "", role: "admin", password: "" });
        dialogAlert({
          title:
            lang === "ne"
              ? "प्रशासक खाता सिर्जना भयो"
              : "Administrator Created",
          description: `${userForm.name} (${userForm.email}) ${t.userAddedSuccess}`,
          type: "success",
        });
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleToggleUser = async (user: AdminUser) => {
    if (!session?.isSuperadmin) {
      dialogAlert({
        title: lang === "ne" ? "अनुमति अस्वीकृत" : "Permission Denied",
        description: t.superadminOnlyNotice,
        type: "danger",
      });
      return;
    }

    setTogglingUserId(user.id);
    try {
      const res = await adminFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        dialogAlert({
          title: lang === "ne" ? "कार्य असफल" : "Action Failed",
          description:
            data.error ||
            (lang === "ne"
              ? "स्थिति अद्यावधिक गर्न सकिएन।"
              : "Failed to update user status."),
          type: "danger",
        });
        return;
      }

      if (data.users) {
        setAdminUsersList(data.users);
        saveAdminUsers(data.users);
      }

      dialogAlert({
        title: lang === "ne" ? "स्थिति अद्यावधिक भयो" : "Status Updated",
        description: `${user.name}: ${t.userStatusChanged}`,
        type: "info",
      });
    } catch {
      dialogAlert({
        title: lang === "ne" ? "कार्य असफल" : "Action Failed",
        description:
          lang === "ne"
            ? "सर्भरसँग सम्पर्क हुन सकेन।"
            : "Network or server error occurred.",
        type: "danger",
      });
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const isSuper =
      session?.isSuperadmin ||
      session?.role === "superadmin" ||
      session?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
      session?.email?.toLowerCase() === "admin@thorgaktm.org.np";

    if (!isSuper) {
      dialogAlert({
        title: lang === "ne" ? "अनुमति अस्वीकृत" : "Permission Denied",
        description: t.superadminOnlyNotice,
        type: "danger",
      });
      return;
    }
    const confirmed = await dialogConfirm({
      title: t.removeUserConfirmTitle,
      description: `${t.removeUserConfirmDesc} (${user.name} - ${user.email})`,
      type: "danger",
      confirmText: t.deleteBtn,
      cancelText: t.cancelBtn,
    });
    if (confirmed) {
      setDeletingUserId(user.id);
      try {
        const res = await adminFetch(
          `/api/users?id=${encodeURIComponent(user.id)}`,
          {
            method: "DELETE",
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          dialogAlert({
            title: lang === "ne" ? "कार्य असफल" : "Action Failed",
            description:
              data.error ||
              (lang === "ne"
                ? "प्रशासक हटाउन सकिएन।"
                : "Failed to remove user."),
            type: "danger",
          });
          return;
        }

        if (data.users && Array.isArray(data.users)) {
          setAdminUsersList(data.users);
          saveAdminUsers(data.users);
        } else {
          const updated = adminUsersList.filter((u) => u.id !== user.id);
          setAdminUsersList(updated);
          saveAdminUsers(updated);
        }

        dialogAlert({
          title: lang === "ne" ? "प्रशासक हटाइयो" : "User Removed",
          description: t.userRemovedSuccess,
          type: "success",
        });
      } catch {
        dialogAlert({
          title: lang === "ne" ? "कार्य असफल" : "Action Failed",
          description:
            lang === "ne"
              ? "सर्भरसँग सम्पर्क हुन सकेन।"
              : "Network or server error occurred.",
          type: "danger",
        });
      } finally {
        setDeletingUserId(null);
      }
    }
  };

  const isSuperadmin =
    session?.isSuperadmin ||
    session?.role === "superadmin" ||
    session?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
    session?.email?.toLowerCase() === "admin@thorgaktm.org.np";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-fg flex items-center gap-2">
            <ShieldCheck size={20} className="text-accent" />
            <span>{t.adminAccess}</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {lang === "ne"
              ? "प्रशासन प्यानल प्रयोग गर्न सक्ने प्रयोगकर्ताहरूको सूची तथा भूमिका व्यवस्थापन।"
              : "Control who can access the admin panel, create accounts, and manage permissions."}
          </p>
        </div>

        {isSuperadmin && (
          <button
            type="button"
            onClick={() => {
              if (showAddUserModal && editingUser) {
                setEditingUser(null);
                setUserForm({ name: "", email: "", role: "admin", password: "" });
              } else {
                setEditingUser(null);
                setUserForm({ name: "", email: "", role: "admin", password: "" });
                setShowAddUserModal(!showAddUserModal);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors shadow-e1 cursor-pointer"
          >
            <Plus size={14} />
            <span>{showAddUserModal ? t.closeBtn : t.addAdminUser}</span>
          </button>
        )}
      </div>

      {/* Add/Edit User Modal / Form */}
      {showAddUserModal && (
        <form
          onSubmit={handleAddUser}
          className="p-6 rounded-card border border-accent/40 bg-surface space-y-4 shadow-e1"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">
              {editingUser ? t.editUserModalTitle : t.addUserModalTitle}
            </div>
            {editingUser && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({
                    name: "",
                    email: "",
                    role: "admin",
                    password: "",
                  });
                  setShowAddUserModal(false);
                }}
                className="text-xs text-muted hover:text-fg font-medium cursor-pointer"
              >
                {t.cancelBtn}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {t.userName} *
              </label>
              <input
                required
                type="text"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
                placeholder="Executive Secretary"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {t.userEmail} *
              </label>
              <input
                required
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                placeholder="secretary@thorgaktm.org.np"
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {t.userRole}
              </label>
              <select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    role: e.target.value as AdminRole,
                  })
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              >
                <option value="superadmin">{t.roleSuperadmin}</option>
                <option value="admin">{t.roleAdmin}</option>
                <option value="editor">{t.roleEditor}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg">
                {t.userPassword}{" "}
                {editingUser
                  ? lang === "ne"
                    ? "(नयाँ पासवर्ड राख्न मात्र लेख्नुहोस्)"
                    : "(Optional: enter new password to change)"
                  : "*"}
              </label>
              <input
                required={!editingUser}
                type="text"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                placeholder={
                  editingUser
                    ? lang === "ne"
                      ? "यथावत राख्न खाली छोड्नुहोस्"
                      : "Leave blank to keep unchanged"
                    : "••••••••"
                }
                className="w-full px-3 py-2 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSavingUser}
              className="px-5 py-2 rounded-control btn-fill bg-accent hover:bg-accent-hover disabled:opacity-60 text-on-accent text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              {isSavingUser && (
                <CircleNotch size={14} className="animate-spin" />
              )}
              <span>
                {isSavingUser
                  ? lang === "ne"
                    ? "सुरक्षित गर्दै..."
                    : "Saving..."
                  : editingUser
                  ? t.saveChanges
                  : t.addAdminUser}
              </span>
            </button>
            {editingUser && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({
                    name: "",
                    email: "",
                    role: "admin",
                    password: "",
                  });
                  setShowAddUserModal(false);
                }}
                className="px-4 py-2 rounded-control border border-line bg-ground text-fg text-xs font-semibold hover:bg-tint cursor-pointer"
              >
                {t.cancelBtn}
              </button>
            )}
          </div>
        </form>
      )}

      {/* Authorized Admin Users Table */}
      <div className="p-4 rounded-card border border-line bg-surface space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-muted px-2 py-1">
          {lang === "ne"
            ? "अधिकृत प्रशासक सूची"
            : "Authorized Administrators List"}
        </div>

        <div className="divide-y divide-line">
          {adminUsersList.map((user) => {
            const isUserSuperadmin =
              user.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ||
              user.role === "superadmin";

            const isCurrentUser =
              session?.email?.toLowerCase() === user.email.toLowerCase();
            const canEdit =
              session?.isSuperadmin ||
              session?.role === "superadmin" ||
              isCurrentUser;

            return (
              <div
                key={user.id}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-control flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isUserSuperadmin
                        ? "bg-warning/20 text-warning"
                        : "bg-accent-soft text-accent"
                    }`}
                  >
                    {isUserSuperadmin ? (
                      <ShieldCheck size={18} />
                    ) : (
                      <UserGear size={18} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-fg truncate">
                        {user.name}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-chip bg-accent/20 text-accent border border-accent/30">
                          {lang === "ne" ? "तपाईंको खाता" : "You"}
                        </span>
                      )}
                      {isUserSuperadmin ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-chip bg-warning/20 text-warning border border-warning/30">
                          {t.roleSuperadmin}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-chip bg-tint text-muted border border-line capitalize">
                          {user.role}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-fg font-medium">
                        {user.email}
                      </span>
                      <span>•</span>
                      <span>Added {user.addedAt}</span>
                      <span>•</span>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          user.isActive ? "text-accent" : "text-danger"
                        }`}
                      >
                        {user.isActive ? (
                          <CheckCircle size={12} weight="fill" />
                        ) : (
                          <XCircle size={12} weight="fill" />
                        )}
                        <span>
                          {user.isActive ? t.activeStatus : t.inactiveStatus}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions (Superadmin or Current User) */}
                {canEdit && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleStartEditUser(user)}
                      className="p-1.5 text-accent hover:bg-accent-soft rounded-control transition-colors flex items-center gap-1 text-xs cursor-pointer"
                      title={t.editUser}
                    >
                      <PencilSimple size={15} />
                      <span className="text-[11px] font-medium">
                        {lang === "ne"
                          ? "पासवर्ड / सम्पादन"
                          : "Edit / Password"}
                      </span>
                    </button>

                    {(session?.isSuperadmin ||
                      session?.role === "superadmin") &&
                      !isUserSuperadmin &&
                      !isCurrentUser && (
                        <>
                          <button
                            type="button"
                            disabled={togglingUserId === user.id}
                            onClick={() => handleToggleUser(user)}
                            className={`px-2.5 py-1 rounded-control text-[11px] font-semibold transition-colors border disabled:opacity-60 flex items-center gap-1 cursor-pointer ${
                              user.isActive
                                ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
                                : "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
                            }`}
                          >
                            {togglingUserId === user.id && (
                              <CircleNotch size={12} className="animate-spin" />
                            )}
                            <span>
                              {user.isActive ? t.deactivate : t.activate}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={deletingUserId === user.id}
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-danger hover:bg-danger/10 disabled:opacity-60 rounded-control transition-colors cursor-pointer"
                            title={t.deleteBtn}
                          >
                            {deletingUserId === user.id ? (
                              <CircleNotch size={15} className="animate-spin" />
                            ) : (
                              <Trash size={15} />
                            )}
                          </button>
                        </>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
