'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateSpeciesSummary, type GenerateSpeciesSummaryOutput } from '@/ai/flows/generate-species-summary';
import { Leaf, UploadCloud, AlertCircle, Loader2, Microscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DetectedPlant {
  name: string;
  count: number;
  scientificName: string;
}

interface ApiUploadResponse {
  detectedPlants: DetectedPlant[];
}

interface ResultItem extends DetectedPlant {
  summary?: string;
}

export default function FloraScanPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResults(null);
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select an image file to upload.');
      toast({
        title: 'No file selected',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      // Step 1: Upload image to our mock API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload image. Server returned an error.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const apiUploadResponse: ApiUploadResponse = await response.json();

      if (!apiUploadResponse.detectedPlants || apiUploadResponse.detectedPlants.length === 0) {
        setError('No plants detected in the image.');
        toast({
          title: 'No plants detected',
          description: 'The API could not identify any plants in the uploaded image.',
          variant: 'default',
        });
        setIsLoading(false);
        return;
      }
      
      const speciesList = apiUploadResponse.detectedPlants.map(p => p.name).join(',');

      // Step 2: Generate summaries using GenAI flow
      const speciesSummaryOutput: GenerateSpeciesSummaryOutput = await generateSpeciesSummary({ speciesList });
      
      // Combine results
      const combinedResults: ResultItem[] = apiUploadResponse.detectedPlants.map(plant => {
        const summaryData = speciesSummaryOutput.summaries.find(s => s.species === plant.name);
        return {
          ...plant,
          summary: summaryData?.summary || 'No summary available.',
        };
      });

      setResults(combinedResults);
      toast({
        title: 'Success!',
        description: 'Plant species identified and summaries generated.',
      });

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
      toast({
        title: 'Processing Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <Microscope className="w-12 h-12 text-primary mr-2" />
          <h1 className="text-4xl font-bold text-primary">FloraScan</h1>
        </div>
        <p className="text-lg text-muted-foreground">Upload an image to identify plant species.</p>
      </header>

      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <UploadCloud className="mr-2 h-6 w-6 text-accent" />
            Upload Plant Image
          </CardTitle>
          <CardDescription>Select an image file (JPEG, PNG, GIF) and submit for analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="file-upload" className="sr-only">Choose file</label>
              <Input
                id="file-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={isLoading}
              />
            </div>

            {previewUrl && (
              <div className="mt-4 border border-dashed border-border rounded-md p-2 flex justify-center">
                <Image 
                  src={previewUrl} 
                  alt="Selected image preview" 
                  width={300} 
                  height={300} 
                  className="max-h-64 w-auto object-contain rounded" 
                  data-ai-hint="plant image"
                />
              </div>
            )}
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Leaf className="mr-2 h-4 w-4" />
                  Identify Plants
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && results.length > 0 && (
        <section className="w-full max-w-2xl mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary text-center">Identification Results</h2>
          <div className="space-y-4">
            {results.map((plant, index) => (
              <Card key={index} className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-primary flex items-center">
                    <Leaf className="mr-2 h-5 w-5" />
                    {plant.name}
                  </CardTitle>
                  <CardDescription>
                    Scientific Name: {plant.scientificName} | Detected: {plant.count}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground">{plant.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FloraScan. Powered by AI.</p>
      </footer>
    </div>
  );
}
