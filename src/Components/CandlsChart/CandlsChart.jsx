import { useState, useEffect, useRef } from "react";
import css from "./CandlsChart.module.css";
import Chart from "react-apexcharts";
import { useSelector } from "react-redux";
import { getItems } from "../../redux/Bitcoin/selector";
import {
  getStartDate,
  getEndDate,
  getFrequency,
} from "../../redux/Bitcoin/selector";

export const CandlsChart = () => {
  //variables from auto removing markers
  const startDate = useSelector(getStartDate);
  const endDate = useSelector(getEndDate);
  const frequency = useSelector(getFrequency);

  const items = useSelector(getItems);

  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [squares, setSquares] = useState([]);
  const [dragging, setDragging] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Control") {
        setCtrlPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Control") {
        setCtrlPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      setSquares([]);
    }
    // Clear all markers when start date, end date, or frequency changes
  }, [startDate, endDate, frequency]);


  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDivClick();
    }
  };

  const handleDivClick = (event) => {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    //check if square exists
    const isExistingSquare = squares.some(
      (square) => Math.abs(square.x - x) < 10 && Math.abs(square.y - y) < 10
    );

    if (!isExistingSquare) {
      const newSquare = { x, y };
      setSquares([...squares, newSquare]);
    }
  };

  const handleSquareRightClick = (event, index) => {
    event.preventDefault();
    setSquares(squares.filter((_, i) => i !== index));
  };

  const handleMouseDown = (index) => (event) => {
    setDragging(index);
  };

  //moving marker by holding mouse btn
  const handleMouseMove = (event) => {
    if (dragging === null) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setSquares((prevSquares) =>
      prevSquares.map((square, index) =>
        index === dragging ? { x, y } : square
      )
    );

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setSquares((prevSquares) => prevSquares.filter((_, i) => i !== dragging));
      setDragging(null);
    }
  };

  //delete marker by moving beyond borders
  const handleTouchMove = (event) => {
    if (dragging === null) return;

    const touch = event.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setSquares((prevSquares) =>
      prevSquares.map((square, index) =>
        index === dragging ? { x, y } : square
      )
    );

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setSquares((prevSquares) => prevSquares.filter((_, i) => i !== dragging));
      setDragging(null);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleTouchEnd = () => {
    setDragging(null);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging]);

  const seriesData = items.map((item) => ({
    x: new Date(item.Date),
    y: [
      parseFloat(item.Open).toFixed(2),
      parseFloat(item.High).toFixed(2),
      parseFloat(item.Low).toFixed(2),
      parseFloat(item.Close).toFixed(2),
    ],
  }));

  const options = {
    chart: {
      type: "candlestick",
      width: "100%",
      toolbar: {
        show: false,
      },
      events: {
        mouseMove: function (event, chartContext) {
          if (!ctrlPressed) {
            chartContext.clearAnnotations();
          }
        },
      },
    },
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      opposite: true,
      tooltip: {
        enabled: ctrlPressed,
      },
    },
    tooltip: {
      enabled: ctrlPressed,
    },
  };

  const series = [
    {
      name: "Bitcoin",
      data: seriesData,
    },
  ];

  return (
    <div
      className={css.chartCont}
      onClick={handleDivClick}
      onKeyDown={handleKeyDown}
      style={{ position: "relative" }}
      ref={containerRef}
    >
      <Chart
        options={options}
        series={series}
        type="candlestick"
        height="100%"
      />
      {squares.map((square, index) => (
        <div
          key={index}
          onContextMenu={(e) => handleSquareRightClick(e, index)}
          onMouseDown={handleMouseDown(index)}
          onTouchStart={handleMouseDown(index)}
          style={{
            position: "absolute",
            top: `${square.y - 14}px`,
            left: `${square.x}px`,
            width: "20px",
            height: "20px",
            backgroundColor: "#FFA500",
            transform: "translate(-50%, -50%) rotate(45deg)",
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  );
};
