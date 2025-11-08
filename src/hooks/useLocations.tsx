import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Department {
  id: string;
  name: string;
}

interface Municipality {
  id: string;
  name: string;
  department_id: string;
}

interface Neighborhood {
  id: string;
  name: string;
  municipality_id: string;
}

export const useLocations = () => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        .order('name');

      if (error) throw error;
      setDepartments(data?.map(d => d.name) || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMunicipalitiesByDepartment = async (departmentName: string): Promise<string[]> => {
    try {
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('name', departmentName)
        .single();

      if (deptError) throw deptError;

      const { data: muniData, error: muniError } = await supabase
        .from('municipalities')
        .select('name')
        .eq('department_id', deptData.id)
        .order('name');

      if (muniError) throw muniError;
      return muniData?.map(m => m.name) || [];
    } catch (error) {
      console.error('Error loading municipalities:', error);
      return [];
    }
  };

  const getNeighborhoodsByMunicipality = async (
    departmentName: string,
    municipalityName: string
  ): Promise<string[]> => {
    try {
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('name', departmentName)
        .single();

      if (deptError) throw deptError;

      const { data: muniData, error: muniError } = await supabase
        .from('municipalities')
        .select('id')
        .eq('department_id', deptData.id)
        .eq('name', municipalityName)
        .single();

      if (muniError) throw muniError;

      const { data: neighData, error: neighError } = await supabase
        .from('neighborhoods')
        .select('name')
        .eq('municipality_id', muniData.id)
        .order('name');

      if (neighError) throw neighError;
      return neighData?.map(n => n.name) || [];
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
      return [];
    }
  };

  return {
    departments,
    loading,
    getDepartments: () => departments,
    getMunicipalitiesByDepartment,
    getNeighborhoodsByMunicipality
  };
};
