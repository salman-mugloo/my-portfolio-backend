import Project from '../models/Project.js';

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .select('-__v');
    const formattedProjects = projects.map((project, index) => ({
      id: project._id.toString(),
      title: project.title,
      desc: project.description,
      tech: project.technologies,
      github: project.githubLink,
      delay: index * 0.1
    }));
    res.json(formattedProjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, description, githubLink, technologies, isPublished } = req.body;
    const project = await Project.create({
      title,
      description,
      githubLink,
      technologies: Array.isArray(technologies) ? technologies : [],
      isPublished: isPublished !== undefined ? isPublished : true
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const { title, description, githubLink, technologies, isPublished } = req.body;
    project.title = title || project.title;
    project.description = description || project.description;
    project.githubLink = githubLink || project.githubLink;
    project.technologies = Array.isArray(technologies) ? technologies : project.technologies;
    project.isPublished = isPublished !== undefined ? isPublished : project.isPublished;
    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};