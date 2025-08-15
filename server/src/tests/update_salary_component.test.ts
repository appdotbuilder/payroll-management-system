import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryComponentsTable } from '../db/schema';
import { type UpdateSalaryComponentInput, type CreateSalaryComponentInput } from '../schema';
import { updateSalaryComponent } from '../handlers/update_salary_component';
import { eq } from 'drizzle-orm';

// Helper function to create a test salary component
const createTestComponent = async (data?: Partial<CreateSalaryComponentInput>) => {
  const defaultData = {
    name: 'Test Component',
    type: 'allowance' as const,
    description: 'Test description'
  };

  const componentData = { ...defaultData, ...data };

  const result = await db.insert(salaryComponentsTable)
    .values(componentData)
    .returning()
    .execute();

  return result[0];
};

describe('updateSalaryComponent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a salary component', async () => {
    // Create initial component
    const initialComponent = await createTestComponent();

    const updateInput: UpdateSalaryComponentInput = {
      id: initialComponent.id,
      name: 'Updated Component',
      type: 'deduction',
      description: 'Updated description'
    };

    const result = await updateSalaryComponent(updateInput);

    // Verify the returned result
    expect(result.id).toBe(initialComponent.id);
    expect(result.name).toBe('Updated Component');
    expect(result.type).toBe('deduction');
    expect(result.description).toBe('Updated description');
    expect(result.created_at).toEqual(initialComponent.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > initialComponent.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create initial component
    const initialComponent = await createTestComponent({
      name: 'Original Name',
      type: 'allowance',
      description: 'Original description'
    });

    const updateInput: UpdateSalaryComponentInput = {
      id: initialComponent.id,
      name: 'Updated Name Only'
    };

    const result = await updateSalaryComponent(updateInput);

    // Verify only name was updated
    expect(result.id).toBe(initialComponent.id);
    expect(result.name).toBe('Updated Name Only');
    expect(result.type).toBe('allowance'); // Should remain unchanged
    expect(result.description).toBe('Original description'); // Should remain unchanged
    expect(result.created_at).toEqual(initialComponent.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > initialComponent.updated_at).toBe(true);
  });

  it('should update description to null', async () => {
    // Create initial component with description
    const initialComponent = await createTestComponent({
      description: 'Original description'
    });

    const updateInput: UpdateSalaryComponentInput = {
      id: initialComponent.id,
      description: null
    };

    const result = await updateSalaryComponent(updateInput);

    // Verify description was set to null
    expect(result.id).toBe(initialComponent.id);
    expect(result.description).toBeNull();
    expect(result.updated_at > initialComponent.updated_at).toBe(true);
  });

  it('should save updated component to database', async () => {
    // Create initial component
    const initialComponent = await createTestComponent();

    const updateInput: UpdateSalaryComponentInput = {
      id: initialComponent.id,
      name: 'Database Updated Name',
      type: 'base_salary'
    };

    await updateSalaryComponent(updateInput);

    // Verify the component was updated in database
    const savedComponent = await db.select()
      .from(salaryComponentsTable)
      .where(eq(salaryComponentsTable.id, initialComponent.id))
      .execute();

    expect(savedComponent).toHaveLength(1);
    expect(savedComponent[0].name).toBe('Database Updated Name');
    expect(savedComponent[0].type).toBe('base_salary');
    expect(savedComponent[0].created_at).toEqual(initialComponent.created_at);
    expect(savedComponent[0].updated_at).toBeInstanceOf(Date);
    expect(savedComponent[0].updated_at > initialComponent.updated_at).toBe(true);
  });

  it('should throw error when component does not exist', async () => {
    const updateInput: UpdateSalaryComponentInput = {
      id: 999999, // Non-existent ID
      name: 'Non-existent Component'
    };

    await expect(updateSalaryComponent(updateInput)).rejects.toThrow(/salary component with id 999999 not found/i);
  });

  it('should handle updating component type correctly', async () => {
    // Create component with each type and update to different type
    const allowanceComponent = await createTestComponent({ 
      name: 'Housing Allowance', 
      type: 'allowance' 
    });

    const updateInput: UpdateSalaryComponentInput = {
      id: allowanceComponent.id,
      type: 'deduction'
    };

    const result = await updateSalaryComponent(updateInput);

    expect(result.type).toBe('deduction');
    expect(result.name).toBe('Housing Allowance'); // Name should remain unchanged
  });

  it('should preserve created_at timestamp when updating', async () => {
    // Create initial component
    const initialComponent = await createTestComponent();
    const originalCreatedAt = initialComponent.created_at;

    // Wait a small amount to ensure updated_at is different
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateSalaryComponentInput = {
      id: initialComponent.id,
      name: 'Updated Name'
    };

    const result = await updateSalaryComponent(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalCreatedAt).toBe(true);
  });
});