import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileUp, FileText, Bot, LoaderCircle } from 'lucide-react'; // Using lucide-react for icons

function App() {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initial connection check
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    axios.get(apiUrl + '/')
      .then(response => setMessage(response.data.message))
      .catch(error => {
        console.error("Error fetching data:", error);
        setMessage("Could not connect to backend.");
      });
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleResumeSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert("Please select a resume file!");
      return;
    }
    if (!jobDescription) {
      alert("Please paste the job description!");
      return;
    }

    setIsLoading(true);
    setAnalysisResult("");

    const formData = new FormData();
    formData.append("resume", selectedFile);
    formData.append("job_description", jobDescription);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/api/analyze-resume`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysisResult(response.data.analysis);
    } catch (error)
    {
      console.error("Error uploading file:", error);
      const errorMsg = error.response?.data?.detail || "Error analyzing resume.";
      setAnalysisResult(`**Error:** ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper component for styled input sections
  const InputSection = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-800 ml-3">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="container mx-auto px-4 py-12">
        
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900">AI Career Assistant</h1>
          <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
            Upload your resume and a job description to get instant, AI-powered feedback.
          </p>
        </header>

        {/* Main Form */}
        <form onSubmit={handleResumeSubmit} className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <InputSection title="1. Upload Your Resume" icon={<FileUp className="text-indigo-600" size={24} />}>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="resume-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF only</p>
                  </div>
                  <input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                </label>
              </div>
              {selectedFile && <p className="mt-4 text-sm text-center text-gray-600">Selected: <span className="font-medium">{selectedFile.name}</span></p>}
            </InputSection>

            <InputSection title="2. Paste Job Description" icon={<Bot className="text-indigo-600" size={24} />}>
              <textarea
                id="job-description"
                rows="8"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full p-3 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </InputSection>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 transition-all duration-300 shadow-lg"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="animate-spin mr-3" />
                Analyzing...
              </>
            ) : (
              'Analyze My Resume'
            )}
          </button>
        </form>

        {/* Results Section */}
        {(isLoading || analysisResult) && (
          <div className="mt-12 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">Analysis Result</h2>
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <LoaderCircle className="w-12 h-12 animate-spin mb-4" />
                  <p className="text-lg">Our AI is reviewing your documents...</p>
                </div>
              ) : (
                <div className="prose max-w-none analysis-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysisResult}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
