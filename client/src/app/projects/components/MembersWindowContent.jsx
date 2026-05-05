'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { MembersModal } from './MembersModal';

export function MembersWindowContent({ project: initialProject, currentUserId, isOwner, onClose }) {
  const [project, setProject] = useState(initialProject);

  const queryClient = useQueryClient();

  const setProjects = (updater) => {
    queryClient.setQueryData(['projects'], (old = []) =>
      typeof updater === 'function' ? updater(old) : updater
    );
  };

  const {
    projectMembers,
    loadingMembers,
    handleAddMember,
    handleRemoveMember,
    handleUpdateRoleDescription,
    handleTransferOwnership: _transfer,
    handleProjectLeave: _leave,
  } = useProjectMembers(project, setProjects);

  const handleTransferOwnership = (memberId) =>
    _transfer(memberId, setProject);

  const handleProjectLeave = (proj) =>
    _leave(proj, () => { setProject(null); onClose(); });

  return (
    <MembersModal
      project={project}
      members={projectMembers}
      loading={loadingMembers}
      isOwner={isOwner}
      currentUserId={currentUserId}
      onAddMember={handleAddMember}
      onRemoveMember={handleRemoveMember}
      onTransferOwnership={handleTransferOwnership}
      onClose={onClose}
      onUpdateRoleDescription={handleUpdateRoleDescription}
    />
  );
}