import { supabase } from '@/integrations/supabase/client';
import { colombiaLocations } from '@/data/colombiaLocations';

export const seedLocationsToDatabase = async () => {
  console.log('Starting location data seeding...');
  
  for (const location of colombiaLocations) {
    try {
      // Insert department
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .insert({ name: location.department })
        .select()
        .single();

      if (deptError) {
        console.error(`Error inserting department ${location.department}:`, deptError);
        continue;
      }

      console.log(`Inserted department: ${location.department}`);

      // Insert municipalities for this department
      for (const municipality of location.municipalities) {
        const { data: muniData, error: muniError } = await supabase
          .from('municipalities')
          .insert({
            name: municipality.name,
            department_id: deptData.id
          })
          .select()
          .single();

        if (muniError) {
          console.error(`Error inserting municipality ${municipality.name}:`, muniError);
          continue;
        }

        console.log(`  Inserted municipality: ${municipality.name}`);

        // Insert neighborhoods for this municipality
        if (municipality.neighborhoods.length > 0) {
          const neighborhoodsToInsert = municipality.neighborhoods.map(n => ({
            name: n,
            municipality_id: muniData.id
          }));

          const { error: neighError } = await supabase
            .from('neighborhoods')
            .insert(neighborhoodsToInsert);

          if (neighError) {
            console.error(`Error inserting neighborhoods for ${municipality.name}:`, neighError);
          } else {
            console.log(`    Inserted ${municipality.neighborhoods.length} neighborhoods`);
          }
        }
      }
    } catch (error) {
      console.error('Error seeding location:', error);
    }
  }

  console.log('Location data seeding completed!');
};
