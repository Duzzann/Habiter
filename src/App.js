import { useState, useEffect } from "react";
import Calendar from "react-calendar"; // Import React-Calendar
import "react-calendar/dist/Calendar.css"; // Import default styles for the calendar

function App() {
  const [habitsByDate, setHabitsByDate] = useState(() => {
    const savedData = localStorage.getItem("habitsByDate");
    return savedData ? JSON.parse(savedData) : {};
  }); // State to store habits by date
  const [selectedDate, setSelectedDate] = useState(new Date()); // State for the selected calendar date
  const [streak, setStreak] = useState(() => {
    const savedStreak = localStorage.getItem("streak");
    return savedStreak ? JSON.parse(savedStreak) : 0;
  }); // Streak of consecutive days with all habits completed

  const selectedDateKey = selectedDate.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
  const habits = habitsByDate[selectedDateKey] || []; // Get habits for the selected date

  // Save habitsByDate and streak to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("habitsByDate", JSON.stringify(habitsByDate));
  }, [habitsByDate]);

  useEffect(() => {
    localStorage.setItem("streak", JSON.stringify(streak));
  }, [streak]);

  // Initialize habits for a new day when the selected date changes
  useEffect(() => {
    if (!habitsByDate[selectedDateKey]) {
      const previousDateKey = new Date(selectedDate);
      previousDateKey.setDate(previousDateKey.getDate() - 1);
      const formattedPreviousDateKey = previousDateKey
        .toISOString()
        .split("T")[0];

      const previousHabits = habitsByDate[formattedPreviousDateKey] || [];
      const resetHabits = previousHabits.map((habit) => ({
        ...habit,
        completed: false, // Reset the completed state
      }));

      setHabitsByDate((prev) => ({
        ...prev,
        [selectedDateKey]: resetHabits,
      }));
    }
  }, [selectedDate, habitsByDate, selectedDateKey]);

  // Update streak whenever habitsByDate changes
  useEffect(() => {
    calculateStreak();
  }, [habitsByDate]);

  function handleAddHabit(habit) {
    setHabitsByDate((prev) => {
      const updatedHabitsByDate = { ...prev };

      // Add the new habit to the current day and all future days
      Object.keys(updatedHabitsByDate).forEach((dateKey) => {
        if (new Date(dateKey) >= new Date(selectedDateKey)) {
          updatedHabitsByDate[dateKey] = [
            ...(updatedHabitsByDate[dateKey] || []),
            { text: habit, completed: false },
          ];
        }
      });

      // Ensure the habit is added to the current day
      if (!updatedHabitsByDate[selectedDateKey]) {
        updatedHabitsByDate[selectedDateKey] = [
          { text: habit, completed: false },
        ];
      }

      return updatedHabitsByDate;
    });
  }

  function handleDeleteHabit(indexToDelete) {
    setHabitsByDate((prev) => {
      const updatedHabitsByDate = { ...prev };

      // Remove the habit from the current day and all future days
      Object.keys(updatedHabitsByDate).forEach((dateKey) => {
        if (new Date(dateKey) >= new Date(selectedDateKey)) {
          updatedHabitsByDate[dateKey] = updatedHabitsByDate[dateKey].filter(
            (_, index) => index !== indexToDelete
          );
        }
      });

      return updatedHabitsByDate;
    });
  }

  function handleToggleComplete(index) {
    setHabitsByDate((prev) => ({
      ...prev,
      [selectedDateKey]: prev[selectedDateKey].map((habit, i) =>
        i === index ? { ...habit, completed: !habit.completed } : habit
      ),
    })); // Toggle the completed state for the selected habit
  }

  function calculateStreak() {
    let currentStreak = 0;
    const sortedDates = Object.keys(habitsByDate).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const date = sortedDates[i];
      const habitsForDate = habitsByDate[date] || [];
      const allCompleted = habitsForDate.every((habit) => habit.completed);

      // Check if all habits that existed on this day were completed
      if (allCompleted) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  }

  // Export data as JSON
  function handleExport() {
    const data = JSON.stringify({ habitsByDate, streak });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "habits.json";
    link.click();
  }

  // Import data from JSON
  function handleImport(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const importedData = JSON.parse(e.target.result);
      setHabitsByDate(importedData.habitsByDate || {});
      setStreak(importedData.streak || 0);
    };
    reader.readAsText(file);
  }

  return (
    <div className="app">
      <Header onExport={handleExport} onImport={handleImport} />
      <div className="content">
        <div className="left">
          <UserProfile
            habits={habits}
            streak={streak}
            selectedDate={selectedDateKey}
          />
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="calendar"
          />
        </div>
        <div className="right">
          <AddForm onAddHabit={handleAddHabit} />
          <HabitList
            habits={habits}
            onDeleteHabit={handleDeleteHabit}
            onToggleComplete={handleToggleComplete}
          />
        </div>
      </div>
    </div>
  );
}

function Header({ onExport, onImport }) {
  return (
    <header className="header">
      <h1 style={{ fontFamily: "'Bello Script', cursive" }}>Habiter</h1>
      <div>
        <button onClick={onExport}>Export</button>
        <label style={{ cursor: "pointer" }}>
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={onImport}
          />
          Import
        </label>
      </div>
    </header>
  );
}

function AddForm({ onAddHabit }) {
  const [input, setInput] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return; // Prevent adding empty habits
    onAddHabit(input); // Pass the new habit to the parent
    setInput(""); // Clear the input field
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter a new habit"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
}

function HabitList({ habits, onDeleteHabit, onToggleComplete }) {
  return (
    <div className="habit-list">
      {habits.map((habit, index) => (
        <div key={index} className="habit-item">
          <input
            type="checkbox"
            checked={habit.completed}
            onChange={() => onToggleComplete(index)}
          />
          <span
            style={{
              textDecoration: habit.completed ? "line-through" : "none",
            }}
          >
            {habit.text}
          </span>
          <button
            className="delete-button"
            onClick={() => onDeleteHabit(index)}
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
}

function UserProfile({ habits, streak, selectedDate }) {
  const totalHabits = habits.length;
  const completedHabits = habits.filter((habit) => habit.completed).length;

  const [avatarUrl, setAvatarUrl] = useState("");

  // Function to generate a random avatar URL
  function generateRandomAvatar() {
    const topTypes = [
      "LongHairStraight",
      "LongHairCurly",
      "LongHairStraight2",
      "ShortHairShaggyMullet",
      "Hat",
      "Hijab",
      "LongHairBigHair",
      "LongHairFrida",
    ]; // Added more feminine hairstyles
    const accessoriesTypes = [
      "Blank",
      "Prescription01",
      "Round",
      "Blank",
      "Kurt",
      "Blank",
      "Sunglasses",
      "Blank",
      "Wayfarers",
    ]; // Added more accessories
    const hairColors = [
      "Brown",
      "Black",
      "Blonde",
      "Red",
      "Auburn",
      "SilverGray",
    ];
    const facialHairTypes = ["Blank"]; // No facial hair for a more neutral look
    const clotheTypes = [
      "ShirtCrewNeck",
      "Hoodie",
      "BlazerShirt",
      "BlazerSweater",
      "Overall",
      "CollarSweater",
    ]; // Added more clothing options
    const clotheColors = [
      "Blue03",
      "Red",
      "Gray02",
      "Pink",
      "PastelYellow",
      "PastelBlue",
    ]; // Added more cheerful colors
    const eyeTypes = ["Happy", "Wink", "Hearts", "Surprised"]; // Added more cheerful eye types
    const eyebrowTypes = ["RaisedExcitedNatural", "Default", "UpDownNatural"]; // Removed sad options
    const mouthTypes = ["Smile", "Twinkle", "Tongue"]; // Added more cheerful expressions
    const skinColors = ["Pale", "Light"]; // Limited to pale and light skin tones

    return `https://avataaars.io/?avatarStyle=Circle&topType=${
      topTypes[Math.floor(Math.random() * topTypes.length)]
    }&accessoriesType=${
      accessoriesTypes[Math.floor(Math.random() * accessoriesTypes.length)]
    }&hairColor=${
      hairColors[Math.floor(Math.random() * hairColors.length)]
    }&facialHairType=${
      facialHairTypes[Math.floor(Math.random() * facialHairTypes.length)]
    }&clotheType=${
      clotheTypes[Math.floor(Math.random() * clotheTypes.length)]
    }&clotheColor=${
      clotheColors[Math.floor(Math.random() * clotheColors.length)]
    }&eyeType=${
      eyeTypes[Math.floor(Math.random() * eyeTypes.length)]
    }&eyebrowType=${
      eyebrowTypes[Math.floor(Math.random() * eyebrowTypes.length)]
    }&mouthType=${
      mouthTypes[Math.floor(Math.random() * mouthTypes.length)]
    }&skinColor=${skinColors[Math.floor(Math.random() * skinColors.length)]}`;
  }
  // Update avatar URL only when the selectedDate changes
  useEffect(() => {
    setAvatarUrl(generateRandomAvatar());
  }, [selectedDate]);

  return (
    <div className="user-profile">
      <div className="profile-picture">
        <img src={avatarUrl} alt="User Avatar" />
      </div>
      <p>
        Completed today: {completedHabits} out of {totalHabits}
      </p>
      <p>Streak: {streak} days</p>
    </div>
  );
}

export default App;
