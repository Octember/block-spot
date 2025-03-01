import { type User } from "wasp/entities";
import {
  type OrganizationTag,
  type OrganizationUser,
  type OrganizationUserTag,
} from "wasp/entities";
import { HttpError } from "wasp/server";
import {
  CreateTag,
  DeleteTag,
  GetOrganizationTags,
  GetUserTags,
  UpdateUserTags,
  UpdateTag,
} from "wasp/server/operations";

export const getOrganizationTags: GetOrganizationTags<
  void,
  OrganizationTag[]
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const organizationUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
    },
    include: {
      organization: true,
    },
  });

  if (!organizationUser) {
    throw new HttpError(403, "User is not part of an organization");
  }

  return context.entities.OrganizationTag.findMany({
    where: {
      organizationId: organizationUser.organizationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

type GetUserTagsInput = {
  userId: string;
};

type GetUserTagsOutput = {
  tags: (OrganizationUserTag & {
    organizationTag: OrganizationTag;
  })[];
};

export const getUserTags: GetUserTags<
  GetUserTagsInput,
  GetUserTagsOutput
> = async ({ userId }: GetUserTagsInput, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const organizationUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
    },
  });

  if (!organizationUser) {
    throw new HttpError(403, "User is not part of an organization");
  }

  if (organizationUser.role !== "OWNER" && context.user.id !== userId) {
    throw new HttpError(403, "Only owners can view other users' tags");
  }

  const targetOrgUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId,
      organizationId: organizationUser.organizationId,
    },
  });

  if (!targetOrgUser) {
    throw new HttpError(404, "User not found in organization");
  }

  return {
    tags: await context.entities.OrganizationUserTag.findMany({
      where: {
        organizationUserId: targetOrgUser.id,
      },
      include: {
        organizationTag: true,
      },
    }),
  };
};

type UpdateUserTagsInput = {
  userId: string;
  tagIds: string[];
};

export const updateUserTags: UpdateUserTags<UpdateUserTagsInput, void> = async (
  { userId, tagIds },
  context,
) => {
  if (!context.user) {
    console.log(
      `[TAGS] Unauthorized attempt to update tags for user ${userId}`,
    );
    throw new HttpError(401);
  }

  const organizationUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
    },
  });

  if (!organizationUser) {
    console.log(
      `[TAGS] User ${context.user.id} attempted to update tags without organization membership`,
    );
    throw new HttpError(403, "User is not part of an organization");
  }

  if (organizationUser.role !== "OWNER") {
    console.log(
      `[TAGS] Non-owner user ${context.user.id} attempted to update tags for user ${userId}`,
    );
    throw new HttpError(403, "Only owners can update tags");
  }

  const targetOrgUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId,
      organizationId: organizationUser.organizationId,
    },
  });

  if (!targetOrgUser) {
    console.log(
      `[TAGS] Target user ${userId} not found in organization ${organizationUser.organizationId}`,
    );
    throw new HttpError(404, "User not found in organization");
  }

  // Verify all tags belong to the organization
  const tags = await context.entities.OrganizationTag.findMany({
    where: {
      id: {
        in: tagIds,
      },
      organizationId: organizationUser.organizationId,
    },
  });

  if (tags.length !== tagIds.length) {
    console.log(
      `[TAGS] Invalid tag IDs provided for user ${userId}: expected ${tagIds.length}, found ${tags.length}`,
    );
    throw new HttpError(400, "Invalid tag IDs provided");
  }

  console.log(
    `[TAGS] Updating tags for user ${userId} in org ${organizationUser.organizationId}: ${tagIds.join(", ")}`,
  );

  // Delete existing tags
  await context.entities.OrganizationUserTag.deleteMany({
    where: {
      organizationUserId: targetOrgUser.id,
    },
  });

  // Create new tags
  await context.entities.OrganizationUserTag.createMany({
    data: tagIds.map((tagId: string) => ({
      organizationUserId: targetOrgUser.id,
      organizationTagId: tagId,
    })),
  });
};

type CreateTagInput = {
  name: string;
};

export const createTag: CreateTag<CreateTagInput, OrganizationTag> = async (
  { name },
  context,
) => {
  if (!context.user) {
    console.log(`[TAGS] Unauthorized attempt to create tag "${name}"`);
    throw new HttpError(401);
  }

  const organizationUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
    },
  });

  if (!organizationUser) {
    console.log(
      `[TAGS] User ${context.user.id} attempted to create tag without organization membership`,
    );
    throw new HttpError(403, "User is not part of an organization");
  }

  if (organizationUser.role !== "OWNER") {
    console.log(
      `[TAGS] Non-owner user ${context.user.id} attempted to create tag`,
    );
    throw new HttpError(403, "Only owners can create tags");
  }

  console.log(
    `[TAGS] Creating tag "${name}" in org ${organizationUser.organizationId}`,
  );
  return context.entities.OrganizationTag.create({
    data: {
      name,
      organizationId: organizationUser.organizationId,
    },
  });
};

type DeleteTagInput = {
  id: string;
};

export const deleteTag: DeleteTag<DeleteTagInput, void> = async (
  { id },
  context,
) => {
  if (!context.user) {
    console.log(`[TAGS] Unauthorized attempt to delete tag ${id}`);
    throw new HttpError(401);
  }

  const organizationUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
    },
  });

  if (!organizationUser) {
    console.log(
      `[TAGS] User ${context.user.id} attempted to delete tag without organization membership`,
    );
    throw new HttpError(403, "User is not part of an organization");
  }

  if (organizationUser.role !== "OWNER") {
    console.log(
      `[TAGS] Non-owner user ${context.user.id} attempted to delete tag ${id}`,
    );
    throw new HttpError(403, "Only owners can delete tags");
  }

  const tag = await context.entities.OrganizationTag.findFirst({
    where: {
      id,
      organizationId: organizationUser.organizationId,
    },
  });

  if (!tag) {
    console.log(
      `[TAGS] Tag ${id} not found in org ${organizationUser.organizationId}`,
    );
    throw new HttpError(404, "Tag not found");
  }

  console.log(
    `[TAGS] Deleting tag ${id} (${tag.name}) from org ${organizationUser.organizationId}`,
  );

  // Delete all user associations first
  await context.entities.OrganizationUserTag.deleteMany({
    where: {
      organizationTagId: id,
    },
  });

  // Delete the tag
  await context.entities.OrganizationTag.delete({
    where: { id },
  });
};

type UpdateTagInput = {
  id: string;
  name: string;
};

export const updateTag: UpdateTag<UpdateTagInput, OrganizationTag> = async (
  { id, name },
  context,
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const organizationUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
    },
  });

  if (!organizationUser) {
    throw new HttpError(403, "User is not part of an organization");
  }

  if (organizationUser.role !== "OWNER") {
    throw new HttpError(403, "Only owners can update tags");
  }

  const tag = await context.entities.OrganizationTag.findFirst({
    where: {
      id,
      organizationId: organizationUser.organizationId,
    },
  });

  if (!tag) {
    throw new HttpError(404, "Tag not found");
  }

  return context.entities.OrganizationTag.update({
    where: { id },
    data: { name },
  });
};
