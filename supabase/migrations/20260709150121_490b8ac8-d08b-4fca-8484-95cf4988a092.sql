CREATE POLICY "Doctors can insert their own responses"
ON public.patient_responses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = doctor_id);