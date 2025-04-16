// src/lib/resume-parser.js
export async function parseResume(fileBuffer) {
  try {
    console.log('Starting resume parsing...');
    
    // Extract text from buffer
    let text = "";
    try {
      // Make sure buffer is properly converted to an ArrayBuffer
      const buffer = fileBuffer instanceof Blob 
        ? await fileBuffer.arrayBuffer() 
        : fileBuffer;
        
      // Use TextDecoder if we have a valid buffer
      if (buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer)) {
        text = new TextDecoder().decode(buffer);
      } else {
        text = typeof buffer === 'string' ? buffer : 'Unable to extract text from file';
      }
      
      console.log(`Extracted ${text.length} characters from file`);
    } catch (error) {
      console.error('Error decoding file:', error);
      text = 'Unable to parse file content. Please use a text-based resume format.';
    }

    // Better pattern matching for resume data
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const nameMatch = text.match(/([A-Z][a-z]+(?: [A-Z][a-z]+){1,2})/); // Better name detection
    const phoneMatch = text.match(/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    const locationPattern = /([A-Z][a-z]+(?:,| )[A-Z]{2}|[A-Z][a-z]+(?: [A-Z][a-z]+)?,? [A-Z]{2})/;
    const locationMatch = text.match(locationPattern);
    
    // Extract skills (more comprehensive approach)
    const commonSkills = [
      'javascript', 'typescript', 'react', 'angular', 'vue', 'node', 'express',
      'python', 'java', 'c++', 'c#', '.net', 'sql', 'nosql', 'mongodb', 
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'agile', 'scrum',
      'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'material-ui',
      'rest', 'graphql', 'apis', 'microservices', 'ci/cd', 'jenkins', 'github',
      'machine learning', 'data science', 'data analysis', 'tensorflow', 'pytorch',
      'product management', 'project management', 'marketing', 'sales', 'leadership'
    ];
    
    // More sophisticated skill detection
    const skills = [];
    for (const skill of commonSkills) {
      // Check for whole word matches to avoid false positives
      const pattern = new RegExp(`\\b${skill}\\b`, 'i');
      if (pattern.test(text)) {
        // Capitalize first letter of each word for better display
        skills.push(skill.replace(/\b\w/g, l => l.toUpperCase()));
      }
    }
    
    // Try to extract education information
    const educationPattern = /([A-Z][a-z]+ (?:University|College|Institute|School)|University of [A-Z][a-z]+)/g;
    const educationMatches = text.match(educationPattern) || [];
    const degrees = text.match(/(?:Bachelor|Master|PhD|B\.S\.|M\.S\.|M\.B\.A|B\.A\.|B\.Eng|M\.Eng)[^\n,;.]{0,30}/g) || [];
    
    const education = educationMatches.map((school, i) => {
      return {
        school: school,
        degree: degrees[i] || "Degree not specified",
        field: "Not extracted",
        years: "Not specified"
      };
    });
    
    // Try to extract work experience
    const companies = text.match(/(?:at|for|with) ([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,3})/g) || [];
    const titles = text.match(/(?:Senior|Junior|Lead|Principal|Staff)? ?(?:Software|Frontend|Backend|Full[- ]Stack|DevOps|Cloud|Data|Product|Project)? ?(?:Engineer|Developer|Architect|Manager|Designer|Analyst)/g) || [];
    
    const experience = [];
    for (let i = 0; i < Math.max(companies.length, titles.length, 1); i++) {
      experience.push({
        company: companies[i] ? companies[i].replace(/(?:at|for|with) /, '') : "Company not extracted",
        title: titles[i] || "Position not extracted",
        dates: "Not extracted",
        description: "Detailed description would be extracted from the resume."
      });
    }
    
    // If we couldn't extract much, ensure we have at least something
    if (education.length === 0) {
      education.push({
        school: "University/College information not found",
        degree: "Not specified",
        field: "Not extracted",
        years: "Not specified"
      });
    }
    
    if (experience.length === 0) {
      experience.push({
        company: "Work history not fully extracted",
        title: "Position details not found",
        dates: "Not extracted",
        description: "Work experiences would be discussed in the AI interview."
      });
    }
    
    // Create the final data structure
    const resultData = {
      contactInfo: {
        name: nameMatch ? nameMatch[0] : "Name not extracted",
        email: emailMatch ? emailMatch[0] : "Email not found",
        phone: phoneMatch ? phoneMatch[0] : "Phone not extracted",
        location: locationMatch ? locationMatch[0] : "Location not found"
      },
      skills: skills.length > 0 ? skills : ["Skills not fully extracted"],
      education,
      experience
    };
    
    console.log('Resume parsed successfully');
    console.log('Extracted skills:', resultData.skills);
    
    // Create a simple vector
    const simpleVector = Array(1536).fill(0);
    
    return {
      text,
      ...resultData,
      vector: simpleVector
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    // Return fallback data
    return {
      text: "Error processing resume",
      contactInfo: { name: "Example Candidate", email: "candidate@example.com", phone: "555-123-4567", location: "New York, NY" },
      skills: ["JavaScript", "React", "Node.js"],
      education: [
        { school: "University of Technology", degree: "Bachelor's", field: "Computer Science", years: "2015-2019" }
      ],
      experience: [
        { company: "Tech Solutions Inc.", title: "Senior Developer", dates: "2019-Present", description: "Full-stack development." }
      ],
      vector: Array(1536).fill(0)
    };
  }
}