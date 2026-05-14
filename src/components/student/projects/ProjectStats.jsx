import { Box, SimpleGrid, Card, CardBody, Text, Heading, VStack, HStack, Icon, Progress, Flex } from "@chakra-ui/react";
import { FaEye, FaHeart, FaDownload, FaStar } from "react-icons/fa";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const ProjectStats = ({ projects = [] }) => {
  // Calculate stats
  const totalViews = projects.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalLikes = projects.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const totalDownloads = projects.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
  // Skills distribution
  const skillsCount = {};
  projects.forEach(p => {
    let skills = [];
    if (typeof p.skills === 'string') {
        skills = p.skills.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(p.skills)) {
        skills = p.skills;
    } else if (Array.isArray(p.technologies)) { // Check mapped technologies too
        skills = p.technologies;
    }
    
    skills.forEach(s => {
      if (s) skillsCount[s] = (skillsCount[s] || 0) + 1;
    });
  });

  const skillLabels = Object.keys(skillsCount);
  const skillData = Object.values(skillsCount);

  const barData = {
    labels: skillLabels,
    datasets: [
      {
        label: 'Projects per Technology',
        data: skillData,
        backgroundColor: '#d4a960',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false, text: 'Tech Stack Usage' },
    },
  };

  // Visibility Distribution
  const publicCount = projects.filter(p => p.visibility === 'PUBLIC').length;
  const privateCount = projects.filter(p => p.visibility === 'PRIVATE').length;

  const doughnutData = {
    labels: ['Public', 'Private'],
    datasets: [
      {
        data: [publicCount, privateCount],
        backgroundColor: ['#48BB78', '#A0AEC0'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <Box p={4}>
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
        <StatsCard icon={FaEye} title="Total Views" value={totalViews} color="blue.500" />
        <StatsCard icon={FaHeart} title="Total Likes" value={totalLikes} color="red.500" />
        <StatsCard icon={FaDownload} title="Installs/Clones" value={totalDownloads} color="green.500" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        <Card shadow="sm" borderRadius="xl">
            <CardBody>
                <Heading size="md" mb={6} color="gray.700">Technology Stack</Heading>
                <Box h="300px">
                    {skillLabels.length > 0 ? <Bar options={barOptions} data={barData} /> : <Text color="gray.600">No technology data available</Text>}
                </Box>
            </CardBody>
        </Card>

        <Card shadow="sm" borderRadius="xl">
            <CardBody>
                <Heading size="md" mb={6} color="gray.700">Project Visibility</Heading>
                <Box h="300px" display="flex" justifyContent="center" alignItems="center">
                    <Box w="250px" h="250px">
                        {(publicCount + privateCount) > 0 ? <Doughnut data={doughnutData} /> : <Text color="gray.500">No visibility data</Text>}
                    </Box>
                </Box>
            </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

const StatsCard = ({ icon, title, value, color }) => (
  <Card shadow="sm" borderRadius="xl" borderLeft="4px solid" borderColor={color}>
    <CardBody>
      <Flex justify="space-between" align="center">
        <Box>
          <Text color="gray.600" fontSize="sm">{title}</Text>
          <Heading size="lg" color="gray.700">{value}</Heading>
        </Box>
        <Box p={3} bg={`${color}20`} borderRadius="full" color={color}>
          <Icon as={icon} boxSize={6} />
        </Box>
      </Flex>
    </CardBody>
  </Card>
);
