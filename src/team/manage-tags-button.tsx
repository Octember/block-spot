"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  useQuery,
  getOrganizationTags,
  createTag,
  deleteTag,
  updateTag,
} from "wasp/client/operations";
import { Button } from "../client/components/button";
import { TextInput } from "../client/components/form/text-input";
import type { OrganizationTag } from "wasp/entities";
import { Modal } from "../client/components/modal";
import { BiLoaderCircle } from "react-icons/bi";
import { useToast } from "../client/toast";

type TagFormData = {
  tags: { id?: string; name: string }[];
};

export function ManageTagsButton() {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { data: tags } = useQuery(getOrganizationTags);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<TagFormData>({
    defaultValues: {
      tags: tags?.map((tag) => ({ id: tag.id, name: tag.name })) ?? [],
    },
  });

  useEffect(() => {
    reset({
      tags: tags?.map((tag) => ({ id: tag.id, name: tag.name })) ?? [],
    });
  }, [tags]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tags",
  });

  const onSubmit = async (data: TagFormData) => {
    try {
      const formTagIds = new Set(
        data.tags.filter((t) => t.id).map((t) => t.id),
      );

      // Delete tags that were removed
      const tagsToDelete = tags?.filter((tag) => !formTagIds.has(tag.id)) || [];
      for (const tag of tagsToDelete) {
        await deleteTag({ id: tag.id });
      }

      // Create new tags
      const tagsToCreate = data.tags.filter((tag) => !tag.id);
      for (const tag of tagsToCreate) {
        await createTag({ name: tag.name });
      }

      // Update existing tags that have changed names
      const tagsToUpdate = data.tags.filter((formTag) => {
        if (!formTag.id) return false; // Skip new tags
        const existingTag = tags?.find((t) => t.id === formTag.id);
        return existingTag && existingTag.name !== formTag.name;
      });

      for (const tag of tagsToUpdate) {
        await updateTag({ id: tag.id!, name: tag.name });
      }
      toast({
        title: "Tags updated",
        description: "Your tags have been updated",
      });
    } catch (error) {
      console.error("Error updating tags:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating your tags",
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        ariaLabel="Open manage tags modal"
      >
        Manage Tags
      </Button>

      <Modal
        heading={{ title: "Manage Tags" }}
        open={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <TextInput
                {...register(`tags.${index}.name`)}
                placeholder="Tag name"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => remove(index)}
                variant="secondary"
                ariaLabel={`Remove tag ${index + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}

          <div className="flex justify-between">
            <Button
              type="button"
              onClick={() => append({ name: "" })}
              variant="secondary"
              ariaLabel="Add new tag"
            >
              Add Tag
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                variant="secondary"
                ariaLabel="Cancel changes"
              >
                Close
              </Button>
              <Button
                type="submit"
                ariaLabel="Save tag changes"
                disabled={!isDirty || isSubmitting}
                icon={
                  isSubmitting ? (
                    <BiLoaderCircle className="w-4 h-4 animate-spin" />
                  ) : undefined
                }
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
