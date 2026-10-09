import { useState } from "react";

import axios from "axios";



import ArchitectureDiagram from "./components/ArchitectureDiagram";

import MonitoringDashboard from "./components/MonitoringDashboard";



import "./App.css";





const API_URL = "http://127.0.0.1:8000";





function App() {



  // =====================================================

  // MANUAL WORKLOAD FORM

  // =====================================================



  const [form, setForm] = useState({

    application_name: "FortiAccess Demo",

    users: 50000,

    traffic_level: "high",

    monthly_budget: 500,

    availability_required: 99.9,

    data_sensitivity: "high",

    performance_priority: 4,

    scalability_priority: 5,

    security_priority: 4,

    role: "cloud_engineer",

    device_trusted: true,

    network_trusted: true

  });





  // =====================================================

  // ANALYSIS STATE

  // =====================================================



  const [result, setResult] = useState(null);



  const [loading, setLoading] = useState(false);

  // Architecture selected by the user.
  // FortiAccess initially selects its own recommendation.
  const [selectedArchitecture, setSelectedArchitecture] = useState(null);



  const [analysisMode, setAnalysisMode] = useState("manual");





  // =====================================================

  // AI STATE

  // =====================================================



  const [aiPrompt, setAiPrompt] = useState("");



  const [aiLoading, setAiLoading] = useState(false);



  const [aiRequirements, setAiRequirements] = useState(null);





  // =====================================================

  // SIMULATOR STATE

  // =====================================================



  const [simulation, setSimulation] = useState(null);



  const [simulationLoading, setSimulationLoading] =

    useState(false);



  const [simulationUsers, setSimulationUsers] =

    useState(150000);



  const [simulationTraffic, setSimulationTraffic] =

    useState("high");



  const [simulationBudget, setSimulationBudget] =

    useState(500);





  // =====================================================

  // HANDLE MANUAL FORM CHANGES

  // =====================================================



  const handleChange = (event) => {



    const {

      name,

      value,

      type,

      checked

    } = event.target;





    setForm((previous) => ({

      ...previous,



      [name]:

        type === "checkbox"

          ? checked

          : type === "number"

            ? Number(value)

            : value

    }));



  };





  // =====================================================

  // MANUAL ARCHITECTURE ANALYSIS

  // =====================================================



  const analyzeArchitecture = async (event) => {



    event.preventDefault();



    setLoading(true);



    try {



      const response = await axios.post(

        `${API_URL}/analyze`,

        form

      );



      setResult(response.data);
      setSelectedArchitecture(response.data.recommendation);



      // Clear AI-only display when switching to manual

      setAiRequirements(null);



    } catch (error) {



      console.error(

        "Analysis failed:",

        error

      );



      alert(

        "Failed to analyze workload. Make sure the FastAPI backend is running."

      );



    } finally {



      setLoading(false);



    }



  };





  // =====================================================

  // AI CLOUD ARCHITECT

  // =====================================================



  const analyzeWithAI = async () => {



    if (!aiPrompt.trim()) {



      alert(

        "Please describe your application first."

      );



      return;

    }





    setAiLoading(true);





    try {



      const response = await axios.post(

        `${API_URL}/ai/analyze`,

        {

          prompt: aiPrompt

        }

      );





      if (!response.data.success) {



        throw new Error(

          response.data.error ||

          "AI analysis failed."

        );



      }





      // -------------------------------------------------

      // Store AI extracted requirements

      // -------------------------------------------------



      setAiRequirements(

        response.data.ai_requirements

      );





      // -------------------------------------------------

      // IMPORTANT:

      // Use the SAME analysis result structure

      // as manual analysis.

      // -------------------------------------------------



      setResult(response.data.analysis);
      setSelectedArchitecture(
        response.data.analysis.recommendation
      );





      // -------------------------------------------------

      // Update workload state.

      //

      // This allows MonitoringDashboard and other

      // existing components to work with AI results.

      // -------------------------------------------------



      const validated =

        response.data.validated_workload;





      setForm((previous) => ({



        ...previous,



        application_name:

          validated.application_name,



        users:

          validated.users,



        traffic_level:

          validated.traffic_level,



        monthly_budget:

          validated.monthly_budget,



        availability_required:

          validated.availability_required,



        data_sensitivity:

          validated.data_sensitivity,



        performance_priority:

          validated.performance_priority,



        scalability_priority:

          validated.scalability_priority,



        security_priority:

          validated.security_priority,



        role:

          validated.role,



        device_trusted:

          validated.device_trusted,



        network_trusted:

          validated.network_trusted



      }));





    } catch (error) {



      console.error(

        "AI analysis failed:",

        error

      );





      alert(

        error.response?.data?.error ||

        error.message ||

        "AI analysis failed. Make sure the FastAPI backend is running."

      );





    } finally {



      setAiLoading(false);



    }



  };





  // =====================================================

  // WHAT-IF SIMULATION

  // =====================================================



  const runSimulation = async () => {



    setSimulationLoading(true);





    try {



      const simulationRequest = {



        ...form,



        users:

          Number(simulationUsers),



        traffic_level:

          simulationTraffic,



        monthly_budget:

          Number(simulationBudget)



      };





      const response = await axios.post(

        `${API_URL}/simulate`,

        simulationRequest

      );





      setSimulation(

        response.data

      );





    } catch (error) {



      console.error(

        "Simulation failed:",

        error

      );





      alert(

        "Failed to run simulation. Make sure the FastAPI backend is running."

      );





    } finally {



      setSimulationLoading(false);



    }



  };





  // =====================================================

  // TERRAFORM GENERATION

  // =====================================================



  const generateTerraform = async (

    architectureId

  ) => {



    try {



      const response = await axios.get(

        `${API_URL}/terraform/${architectureId}`

      );





      const terraformCode =

        response.data.terraform;





      const blob = new Blob(

        [terraformCode],

        {

          type: "text/plain"

        }

      );





      const url =

        window.URL.createObjectURL(blob);





      const link =

        document.createElement("a");





      link.href = url;



      link.download =

        `fortiaccess-${architectureId}.tf`;





      document.body.appendChild(link);



      link.click();



      link.remove();



      window.URL.revokeObjectURL(url);





    } catch (error) {



      console.error(

        "Terraform generation failed:",

        error

      );





      alert(

        "Failed to generate Terraform. Make sure the backend is running."

      );



    }



  };





  // =====================================================

  // FORMAT SCORE

  // =====================================================



  const formatScore = (score) => {



    if (

      score === undefined ||

      score === null

    ) {



      return "—";



    }





    return Number(score).toFixed(2);



  };

  const selectArchitecture = (architecture) => {
    setSelectedArchitecture(architecture);
  };

  const activeArchitecture =
    selectedArchitecture || result?.recommendation;





  // =====================================================

  // UI

  // =====================================================



  return (



    <div className="app">





      {/* =================================================

          HEADER

          ================================================= */}



      <header className="header">



        <div className="header-inner">



          <div className="brand">



            <div className="brand-icon">

              F

            </div>



            <div>



              <h1>

                FortiAccess

              </h1>



              <span>

                Adaptive Cloud Architecture Platform

              </span>



            </div>



          </div>





          <div className="status">



            <span className="status-dot"></span>



            Cloud Optimization Engine



          </div>



        </div>



      </header>





      {/* =================================================

          HERO

          ================================================= */}



      <section className="hero">



        <div className="hero-content">



          <span className="eyebrow">



            CLOUD ARCHITECTURE OPTIMIZATION



          </span>





          <h2>



            Design smarter cloud architectures



          </h2>





          <p>



            FortiAccess analyzes workload requirements and

            recommends an AWS architecture based on cost,

            performance, scalability, availability and security.



          </p>



        </div>



      </section>





      <main className="container">





        {/* =================================================

            WORKLOAD / AI INPUT CARD

            ================================================= */}



        <section className="card">





          {/* =================================================

              ANALYSIS MODE

              ================================================= */}



          <div className="analysis-mode">



            <span className="section-label">

              ANALYSIS METHOD

            </span>





            <div className="mode-buttons">



              <button

                type="button"

                className={

                  analysisMode === "manual"

                    ? "mode-button active"

                    : "mode-button"

                }

                onClick={() => {



                  setAnalysisMode("manual");



                }}

              >



                Manual Analysis



              </button>





              <button

                type="button"

                className={

                  analysisMode === "ai"

                    ? "mode-button active"

                    : "mode-button"

                }

                onClick={() => {



                  setAnalysisMode("ai");



                }}

              >



                AI Cloud Architect



              </button>



            </div>



          </div>





          {/* =================================================

              SECTION HEADING

              ================================================= */}



          <div className="section-heading">



            <div>



              <span className="section-label">



                STEP 01



              </span>





              <h2>



                {analysisMode === "manual"

                  ? "Workload Requirements"

                  : "AI Cloud Architect"}



              </h2>





              <p>



                {analysisMode === "manual"

                  ? "Define the requirements of your application."

                  : "Describe your application in natural language and let FortiAccess extract the cloud requirements."}



              </p>



            </div>



          </div>





          {/* =================================================

              MANUAL MODE

              ================================================= */}



          {analysisMode === "manual" && (



            <form

              onSubmit={analyzeArchitecture}

            >





              <div className="form-grid">





                {/* Application Name */}



                <div className="form-group">



                  <label>

                    Application Name

                  </label>





                  <input

                    type="text"

                    name="application_name"

                    value={form.application_name}

                    onChange={handleChange}

                  />



                </div>





                {/* Users */}



                <div className="form-group">



                  <label>

                    Expected Users

                  </label>





                  <input

                    type="number"

                    name="users"

                    min="1"

                    value={form.users}

                    onChange={handleChange}

                  />



                </div>





                {/* Traffic */}



                <div className="form-group">



                  <label>

                    Traffic Level

                  </label>





                  <select

                    name="traffic_level"

                    value={form.traffic_level}

                    onChange={handleChange}

                  >



                    <option value="low">

                      Low

                    </option>



                    <option value="medium">

                      Medium

                    </option>



                    <option value="high">

                      High

                    </option>



                  </select>



                </div>





                {/* Budget */}



                <div className="form-group">



                  <label>

                    Monthly Budget ($)

                  </label>





                  <input

                    type="number"

                    name="monthly_budget"

                    min="1"

                    value={form.monthly_budget}

                    onChange={handleChange}

                  />



                </div>





                {/* Availability */}



                <div className="form-group">



                  <label>

                    Availability Required (%)

                  </label>





                  <input

                    type="number"

                    name="availability_required"

                    min="90"

                    max="99.99"

                    step="0.01"

                    value={form.availability_required}

                    onChange={handleChange}

                  />



                </div>





                {/* Data Sensitivity */}



                <div className="form-group">



                  <label>

                    Data Sensitivity

                  </label>





                  <select

                    name="data_sensitivity"

                    value={form.data_sensitivity}

                    onChange={handleChange}

                  >



                    <option value="low">

                      Low

                    </option>



                    <option value="medium">

                      Medium

                    </option>



                    <option value="high">

                      High

                    </option>



                  </select>



                </div>





                {/* Performance Priority */}



                <div className="form-group">



                  <label>

                    Performance Priority

                  </label>





                  <select

                    name="performance_priority"

                    value={form.performance_priority}

                    onChange={handleChange}

                  >



                    <option value="1">

                      1 - Low

                    </option>



                    <option value="2">

                      2

                    </option>



                    <option value="3">

                      3 - Medium

                    </option>



                    <option value="4">

                      4

                    </option>



                    <option value="5">

                      5 - Critical

                    </option>



                  </select>



                </div>





                {/* Scalability Priority */}



                <div className="form-group">



                  <label>

                    Scalability Priority

                  </label>





                  <select

                    name="scalability_priority"

                    value={form.scalability_priority}

                    onChange={handleChange}

                  >



                    <option value="1">

                      1 - Low

                    </option>



                    <option value="2">

                      2

                    </option>



                    <option value="3">

                      3 - Medium

                    </option>



                    <option value="4">

                      4

                    </option>



                    <option value="5">

                      5 - Critical

                    </option>



                  </select>



                </div>





                {/* Security Priority */}



                <div className="form-group">



                  <label>

                    Security Priority

                  </label>





                  <select

                    name="security_priority"

                    value={form.security_priority}

                    onChange={handleChange}

                  >



                    <option value="1">

                      1 - Low

                    </option>



                    <option value="2">

                      2

                    </option>



                    <option value="3">

                      3 - Medium

                    </option>



                    <option value="4">

                      4

                    </option>



                    <option value="5">

                      5 - Critical

                    </option>



                  </select>



                </div>





                {/* Role */}



                <div className="form-group">



                  <label>

                    User Role

                  </label>





                  <select

                    name="role"

                    value={form.role}

                    onChange={handleChange}

                  >



                    <option value="admin">

                      Admin

                    </option>



                    <option value="cloud_engineer">

                      Cloud Engineer

                    </option>



                    <option value="viewer">

                      Viewer

                    </option>



                  </select>



                </div>



              </div>





              {/* Trust Options */}



              <div className="trust-options">





                <label className="checkbox-label">



                  <input

                    type="checkbox"

                    name="device_trusted"

                    checked={form.device_trusted}

                    onChange={handleChange}

                  />



                  Trusted Device



                </label>





                <label className="checkbox-label">



                  <input

                    type="checkbox"

                    name="network_trusted"

                    checked={form.network_trusted}

                    onChange={handleChange}

                  />



                  Trusted Network



                </label>





              </div>





              <button

                type="submit"

                className="primary-button"

                disabled={loading}

              >



                {loading

                  ? "Analyzing Architecture..."

                  : "Analyze Architecture"}



              </button>





            </form>



          )}





          {/* =================================================

              AI MODE

              ================================================= */}



          {analysisMode === "ai" && (



            <div className="ai-architect">





              <div className="ai-intro">



                <span className="section-label">

                  AI CLOUD ARCHITECT

                </span>





                <h3>

                  Describe your application

                </h3>





                <p>



                  Explain your workload in natural language.

                  FortiAccess AI will extract the requirements

                  and use the optimization engine to recommend

                  the best architecture.



                </p>



              </div>





              <textarea

                className="ai-prompt"

                placeholder="Example: I need an e-commerce application for around 100000 users. Traffic will be high. My budget is 700 dollars per month. Customer data is highly sensitive. Scalability and security are my top priorities."

                value={aiPrompt}

                onChange={(event) =>

                  setAiPrompt(event.target.value)

                }

                rows={7}

              />





              <button

                type="button"

                className="primary-button"

                onClick={analyzeWithAI}

                disabled={aiLoading}

              >



                {aiLoading

                  ? "Analyzing with AI..."

                  : "Analyze with AI"}



              </button>





              {/* =================================================

                  AI EXTRACTED REQUIREMENTS

                  ================================================= */}



              {aiRequirements && (



                <div className="ai-requirements">





                  <div className="section-heading">



                    <div>



                      <span className="section-label">

                        AI EXTRACTED REQUIREMENTS

                      </span>





                      <h3>

                        Understanding your workload

                      </h3>



                    </div>



                  </div>





                  <div className="metrics-grid">





                    <div className="metric">



                      <span>

                        Users

                      </span>



                      <strong>



                        {Number(

                          aiRequirements.users

                        ).toLocaleString()}



                      </strong>



                    </div>





                    <div className="metric">



                      <span>

                        Traffic

                      </span>



                      <strong>



                        {aiRequirements.traffic_level}



                      </strong>



                    </div>





                    <div className="metric">



                      <span>

                        Budget

                      </span>



                      <strong>



                        $

                        {aiRequirements.monthly_budget}



                      </strong>



                    </div>





                    <div className="metric">



                      <span>

                        Data Sensitivity

                      </span>



                      <strong>



                        {aiRequirements.data_sensitivity}



                      </strong>



                    </div>





                    <div className="metric">



                      <span>

                        Scalability Priority

                      </span>



                      <strong>



                        {aiRequirements.scalability_priority}

                        /5



                      </strong>



                    </div>





                    <div className="metric">



                      <span>

                        Security Priority

                      </span>



                      <strong>



                        {aiRequirements.security_priority}

                        /5



                      </strong>



                    </div>





                  </div>





                  <div className="ai-reasoning">



                    <strong>

                      AI reasoning

                    </strong>





                    <p>

                      {aiRequirements.reasoning}

                    </p>



                  </div>





                </div>



              )}



            </div>



          )}



        </section>





        {/* =================================================

            ANALYSIS RESULTS

            ================================================= */}



        {result && (



          <section className="results">





            {/* =================================================

                RECOMMENDATION

                ================================================= */}



            <div className="card recommendation-card">





              <div className="recommendation-header">



                <div>



                  <span className="section-label">

                    SELECTED ARCHITECTURE

                  </span>





                  <h2>

                    {activeArchitecture.name}

                  </h2>





                  <p>

                    {activeArchitecture.type}

                  </p>

                  <p className="selection-subtext">
                    FortiAccess recommendation: <strong>{result.recommendation.name}</strong>
                  </p>



                </div>





                <div className="score-badge">



                  <span>

                    Overall Score

                  </span>





                  <strong>



                    {formatScore(

                      activeArchitecture.overall_score

                    )}



                  </strong>





                  <small>

                    / 100

                  </small>



                </div>



              </div>





              <div className="metrics-grid">





                <div className="metric">



                  <span>

                    Monthly Cost

                  </span>



                  <strong>



                    $



                    {Number(

                      activeArchitecture

                        .estimated_monthly_cost

                    ).toFixed(0)}



                  </strong>



                </div>





                <div className="metric">



                  <span>

                    Performance

                  </span>



                  <strong>

                    {activeArchitecture.performance_score}

                  </strong>



                  <small>

                    / 100

                  </small>



                </div>





                <div className="metric">



                  <span>

                    Scalability

                  </span>



                  <strong>

                    {activeArchitecture.scalability_score}

                  </strong>



                  <small>

                    / 100

                  </small>



                </div>





                <div className="metric">



                  <span>

                    Availability

                  </span>



                  <strong>

                    {activeArchitecture.availability_score}

                  </strong>



                  <small>

                    / 100

                  </small>



                </div>





                <div className="metric">



                  <span>

                    Security

                  </span>



                  <strong>

                    {activeArchitecture.security_score}

                  </strong>



                  <small>

                    / 100

                  </small>



                </div>





              </div>





              <button

                className="primary-button terraform-button"

                onClick={() =>

                  generateTerraform(

                    activeArchitecture.id

                  )

                }

              >



                Generate Terraform



              </button>





            </div>

            {/* =================================================
                ARCHITECTURE COMPARISON + SELECTION
                ================================================= */}

            <div className="card architecture-selection-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">STEP 02</span>
                  <h2>Architecture Comparison</h2>
                  <p>
                    FortiAccess evaluated three candidate architectures.
                    Select an architecture to explore its detailed
                    configuration and metrics.
                  </p>
                </div>
              </div>

              <div className="selection-notice">
                <div>
                  <span className="selection-notice-label">
                    FORTIACCESS RECOMMENDATION
                  </span>
                  <strong>{result.recommendation.name}</strong>
                </div>
                <span className="recommended-tag">Recommended</span>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Architecture</th>
                      <th>Type</th>
                      <th>Cost</th>
                      <th>Performance</th>
                      <th>Scalability</th>
                      <th>Availability</th>
                      <th>Security</th>
                      <th>Overall</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.architectures.map((architecture) => {
                      const isRecommended = architecture.id === result.recommendation.id;
                      const isSelected = activeArchitecture?.id === architecture.id;

                      return (
                        <tr
                          key={architecture.id}
                          className={
                            isSelected
                              ? "selected-row"
                              : isRecommended
                                ? "recommended-row"
                                : ""
                          }
                        >
                          <td>
                            <strong>{architecture.name}</strong>
                            {isRecommended && (
                              <span className="recommended-tag">Recommended</span>
                            )}
                            {isSelected && (
                              <span className="selected-tag">Selected</span>
                            )}
                          </td>
                          <td>{architecture.type}</td>
                          <td>${Number(architecture.estimated_monthly_cost).toFixed(0)}</td>
                          <td>{architecture.performance_score}</td>
                          <td>{architecture.scalability_score}</td>
                          <td>{architecture.availability_score}</td>
                          <td>{architecture.security_score}</td>
                          <td><strong>{formatScore(architecture.overall_score)}</strong></td>
                          <td>
                            <button
                              type="button"
                              className={isSelected ? "architecture-select-button selected" : "architecture-select-button"}
                              onClick={() => selectArchitecture(architecture)}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>





            {/* =================================================

                ARCHITECTURE DIAGRAM

                ================================================= */}



            <div className="card">



              <div className="section-heading">



                <div>



                  <span className="section-label">

                    ARCHITECTURE

                  </span>





                  <h2>

                    Selected Architecture

                  </h2>





                  <p className="diagram-description">



                    Visual representation of the architecture selected

                    for detailed analysis.



                  </p>



                </div>



              </div>





              <ArchitectureDiagram

                architecture={
                  activeArchitecture
                }

              />



            </div>





            {/* =================================================

                MONITORING

                ================================================= */}



            <div className="card">



              <MonitoringDashboard

                architecture={
                  activeArchitecture
                }
                workload={form}

              />



            </div>





            {/* =================================================

                ZERO TRUST SECURITY

                ================================================= */}



            <div className="card">





              <div className="section-heading">



                <div>



                  <span className="section-label">

                    ZERO TRUST

                  </span>





                  <h2>

                    Access Risk Assessment

                  </h2>



                </div>



              </div>





              <div className="security-grid">





                <div className="security-item">



                  <span>

                    Risk Score

                  </span>





                  <strong>

                    {result.access_risk.risk_score}

                  </strong>





                  <small>

                    / 100

                  </small>



                </div>





                <div className="security-item">



                  <span>

                    Risk Level

                  </span>





                  <strong>

                    {result.access_risk.risk_level}

                  </strong>



                </div>





                <div className="security-item">



                  <span>

                    Access Decision

                  </span>





                  <strong>

                    {result.access_risk.decision}

                  </strong>



                </div>





              </div>



            </div>





            {/* =================================================

                ARCHITECTURE COMPARISON

                ================================================= */}









          </section>



        )}





        {/* =================================================

            WHAT-IF SIMULATOR

            ================================================= */}



        <section className="card simulator-card">





          <div className="section-heading">



            <div>



              <span className="section-label">

                STEP 02

              </span>





              <h2>

                What-If Simulator

              </h2>





              <p>



                Test how architecture recommendations change

                when workload conditions change.



              </p>



            </div>



          </div>





          <div className="simulation-controls">





            <div className="form-group">



              <label>

                Users

              </label>





              <input

                type="number"

                min="1"

                value={simulationUsers}

                onChange={(event) =>

                  setSimulationUsers(

                    event.target.value

                  )

                }

              />



            </div>





            <div className="form-group">



              <label>

                Traffic

              </label>





              <select

                value={simulationTraffic}

                onChange={(event) =>

                  setSimulationTraffic(

                    event.target.value

                  )

                }

              >



                <option value="low">

                  Low

                </option>



                <option value="medium">

                  Medium

                </option>



                <option value="high">

                  High

                </option>



              </select>



            </div>





            <div className="form-group">



              <label>

                Budget ($)

              </label>





              <input

                type="number"

                min="1"

                value={simulationBudget}

                onChange={(event) =>

                  setSimulationBudget(

                    event.target.value

                  )

                }

              />



            </div>





          </div>





          <button

            className="secondary-button"

            onClick={runSimulation}

            disabled={simulationLoading}

          >



            {simulationLoading

              ? "Running Simulation..."

              : "Run What-If Simulation"}



          </button>





          {simulation && (



            <div className="simulation-results">





              <div className="simulation-recommendation">



                <span className="section-label">

                  SIMULATION RESULT

                </span>





                <h3>

                  {

                    simulation

                      .recommended_architecture

                      .name

                  }

                </h3>





                <p>



                  Recommended for{" "}



                  {simulation.simulation.users.toLocaleString()}



                  {" "}users with{" "}



                  {simulation.simulation.traffic_level}



                  {" "}traffic and a $



                  {simulation.simulation.monthly_budget}



                  {" "}monthly budget.



                </p>



              </div>





              <div className="metrics-grid">





                <div className="metric">



                  <span>

                    Cost

                  </span>





                  <strong>



                    $



                    {Number(

                      simulation

                        .recommended_architecture

                        .estimated_monthly_cost

                    ).toFixed(0)}



                  </strong>



                </div>





                <div className="metric">



                  <span>

                    Performance

                  </span>





                  <strong>



                    {

                      simulation

                        .recommended_architecture

                        .performance_score

                    }



                  </strong>



                </div>





                <div className="metric">



                  <span>

                    Scalability

                  </span>





                  <strong>



                    {

                      simulation

                        .recommended_architecture

                        .scalability_score

                    }



                  </strong>



                </div>





                <div className="metric">



                  <span>

                    Security

                  </span>





                  <strong>



                    {

                      simulation

                        .recommended_architecture

                        .security_score

                    }



                  </strong>



                </div>





                <div className="metric">



                  <span>

                    Overall

                  </span>





                  <strong>



                    {formatScore(

                      simulation

                        .recommended_architecture

                        .overall_score

                    )}



                  </strong>



                </div>





              </div>





              <div className="table-wrapper">



                <table>



                  <thead>



                    <tr>



                      <th>

                        Architecture

                      </th>



                      <th>

                        Type

                      </th>



                      <th>

                        Cost

                      </th>



                      <th>

                        Performance

                      </th>



                      <th>

                        Scalability

                      </th>



                      <th>

                        Security

                      </th>



                      <th>

                        Overall

                      </th>



                    </tr>



                  </thead>





                  <tbody>



                    {simulation.architectures.map(

                      (architecture) => (



                        <tr

                          key={architecture.id}

                          className={

                            architecture.id ===

                              simulation

                                .recommended_architecture

                                .id

                              ? "recommended-row"

                              : ""

                          }

                        >





                          <td>



                            <strong>

                              {architecture.name}

                            </strong>



                          </td>





                          <td>

                            {architecture.type}

                          </td>





                          <td>



                            $



                            {Number(

                              architecture

                                .estimated_monthly_cost

                            ).toFixed(0)}



                          </td>





                          <td>

                            {architecture.performance_score}

                          </td>





                          <td>

                            {architecture.scalability_score}

                          </td>





                          <td>

                            {architecture.security_score}

                          </td>


                        


                          <td>



                            <strong>



                              {formatScore(

                                architecture

                                  .overall_score

                              )}



                            </strong>



                          </td>





                        </tr>



                      )

                    )}



                  </tbody>



                </table>



              </div>





            </div>



          )}





        </section>





      </main>





      {/* =================================================

          FOOTER

          ================================================= */}



      <footer className="footer">



        <p>



          FortiAccess — Adaptive Cloud Architecture and

          Access Optimization Platform



        </p>



      </footer>





    </div>



  );



}





export default App;